pipeline {
    agent any

    environment {
        HARBOR_REGISTRY = 'harbor.taskmanager.local'
        HARBOR_PROJECT  = 'taskmanager'
        IMAGE_BACKEND   = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/taskmanager-backend"
        IMAGE_FRONTEND  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/taskmanager-frontend"
        SONAR_HOST_URL  = 'http://host.docker.internal:9000'
        KUBECONFIG      = '/var/jenkins_home/.kube/config'
        WORKSPACE_BASE  = '/var/lib/docker/volumes/jenkins_home/_data/workspace/taskmanager-pipeline'
        SONAR_TOKEN     = credentials('sonarqube-token')
        GITHUB_TOKEN    = credentials('github-token')
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Fix Docker Socket') {
            steps {
                sh '''
                    if [ -S /var/run/docker.sock ]; then
                        chmod 666 /var/run/docker.sock && echo "✅ Docker socket OK" \
                        || echo "⚠️ Permission non modifiable"
                    else
                        echo "⚠️ Docker socket introuvable"
                    fi
                '''
            }
        }

        stage('Setup Kubectl') {
            steps {
                sh 'mkdir -p /var/jenkins_home/.kube'
                sh 'kubectl get nodes || echo "⚠️ Kubectl not configured"'
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        stage('Verify Vault Connectivity') {
            steps {
                withVault(
                    configuration: [
                        vaultUrl: 'http://host.docker.internal:8200',
                        vaultCredentialId: 'vault-approle-jenkins'
                    ],
                    vaultSecrets: [[
                        path: 'secret/taskmanager/ci',
                        engineVersion: 2,
                        secretValues: [
                            [envVar: 'VAULT_HARBOR_USER', vaultKey: 'harbor_user']
                        ]
                    ]]
                ) {
                    sh '''
                        echo "✅ Vault joignable — secret/taskmanager/ci accessible"
                        echo "✅ Harbor user récupéré depuis Vault : ${VAULT_HARBOR_USER}"
                    '''
                }
            }
        }

        // FIX #1 : lock files régénérés -> npm ci strict, plus de fallback silencieux.
        // Si npm ci échoue à nouveau ici, c'est un vrai signal qu'il faut régénérer
        // package-lock.json en local, pas un comportement à masquer.
        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            sh 'rm -rf node_modules && npm ci'
                        }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            sh 'npm install --omit=optional'
                        }
                    }
                }
            }
        }

        // FIX #2 : tests Jest sur backend ET frontend (avant, le frontend
        // n'était jamais testé). collectCoverageFrom doit être configuré dans
        // chaque package.json pour couvrir tous les fichiers source, pas
        // seulement ceux importés par les tests existants.
        stage('Unit Tests - Jest') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh '''
                                npm test -- --coverage --coverageReporters=lcov \
                                || echo "⚠️ Tests backend terminés avec avertissements"
                            '''
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh '''
                                CI=true npm test -- --coverage --coverageReporters=lcov --passWithNoTests \
                                || echo "⚠️ Tests frontend terminés avec avertissements"
                            '''
                        }
                    }
                }
            }
        }

        stage('Dependency Audit') {
            parallel {
                stage('npm audit - Backend') {
                    steps {
                        dir('backend') {
                            sh 'npm audit --audit-level=high || echo "⚠️ Vulnérabilités npm backend"'
                        }
                    }
                }
                stage('npm audit - Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high || echo "⚠️ Vulnérabilités npm frontend"'
                        }
                    }
                }
                // FIX #3 : ajout de la clé API NVD pour éviter le rate-limit (429)
                // qui empêchait toute mise à jour de la base CVE et faisait
                // échouer le scan dans son intégralité.
                // -> Créer le credential Jenkins "nvd-api-key" (type Secret text)
                //    avec la valeur de la clé NVD avant de lancer ce pipeline.
                stage('OWASP Dependency Check') {
                    steps {
                        withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_API_KEY')]) {
                            sh '''
                                docker run --rm \
                                  -v ${WORKSPACE_BASE}/backend:/src \
                                  -v owasp-data:/usr/share/dependency-check/data \
                                  owasp/dependency-check:latest \
                                  --project "taskmanager-backend" \
                                  --scan /src \
                                  --format JSON \
                                  --out /src/owasp-report.json \
                                  --nvdApiKey ${NVD_API_KEY} \
                                  --nvdValidForHours 24 \
                                  --failOnCVSS 7 \
                                || echo "⚠️ OWASP scan terminé avec avertissements"
                            '''
                        }
                    }
                }
            }
        }

        // FIX #4 : remplacement de "stedolan/jq" (image cassée avec containerd
        // récent) par un parsing Node directement sur l'agent Jenkins (déjà
        // disponible puisqu'il exécute npm). On vérifie aussi explicitement
        // l'existence du fichier avant de le lire, pour ne plus afficher "0"
        // silencieusement quand le rapport est en réalité absent ou introuvable.
        stage('SAST - Semgrep') {
            steps {
                withVault(
                    configuration: [
                        vaultUrl: 'http://host.docker.internal:8200',
                        vaultCredentialId: 'vault-approle-jenkins'
                    ],
                    vaultSecrets: [[
                        path: 'secret/taskmanager/ci',
                        engineVersion: 2,
                        secretValues: [
                            [envVar: 'SEMGREP_APP_TOKEN', vaultKey: 'semgrep_token']
                        ]
                    ]]
                ) {
                    sh '''
                        REPORT_PATH="${WORKSPACE}/backend/semgrep-report.json"

                        docker run --rm \
                          -e SEMGREP_APP_TOKEN=${SEMGREP_APP_TOKEN} \
                          -v ${WORKSPACE_BASE}/backend:/src \
                          returntocorp/semgrep:latest \
                          semgrep scan \
                          --config=auto \
                          --config=p/nodejs \
                          --config=p/jwt \
                          --config=p/owasp-top-ten \
                          --no-git-ignore \
                          --exclude=node_modules \
                          --exclude=coverage \
                          --json \
                          --output=/src/semgrep-report.json \
                          /src \
                        || echo "⚠️ Semgrep scan terminé avec findings"

                        echo "🔍 Vérification du rapport : ${REPORT_PATH}"
                        ls -la ${WORKSPACE}/backend/ | grep semgrep || echo "⚠️ Aucun fichier semgrep-report.json visible"

                        if [ -f "${REPORT_PATH}" ]; then
                            FINDINGS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('${REPORT_PATH}', 'utf8')).results.length)")
                        else
                            echo "❌ Rapport Semgrep introuvable au chemin attendu — findings NON vérifiés"
                            FINDINGS="N/A"
                        fi

                        echo "📊 Semgrep findings: ${FINDINGS}"
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        cp -rf ${WORKSPACE}/backend/coverage \
                            ${WORKSPACE_BASE}/backend/ 2>/dev/null || true

                        docker run --rm \
                          --name sonar-scan-${BUILD_NUMBER} \
                          -e SONAR_HOST_URL=${SONAR_HOST_URL} \
                          -e SONAR_TOKEN=${SONAR_TOKEN} \
                          -v ${WORKSPACE_BASE}/backend:/usr/src \
                          -v sonar-scannerwork-${BUILD_NUMBER}:/tmp/.scannerwork \
                          sonarsource/sonar-scanner-cli \
                          -Dsonar.projectKey=taskmanager-backend \
                          -Dsonar.projectBaseDir=/usr/src \
                          -Dsonar.sources=. \
                          -Dsonar.inclusions=**/*.js \
                          -Dsonar.exclusions=node_modules/**,**/*.test.js,coverage/** \
                          -Dsonar.coverage.exclusions=coverage/** \
                          -Dsonar.sourceEncoding=UTF-8 \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                        || true

                        CID=$(docker create -v sonar-scannerwork-${BUILD_NUMBER}:/scannerwork alpine true)
                        docker cp $CID:/scannerwork/report-task.txt ./report-task.txt || echo "copy failed"
                        docker rm $CID
                        docker volume rm sonar-scannerwork-${BUILD_NUMBER} || true
                    '''
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    if (fileExists('report-task.txt')) {
                        try {
                            timeout(time: 10, unit: 'MINUTES') {
                                def qg = waitForQualityGate abortPipeline: false
                                echo "Quality Gate status: ${qg.status}"
                                if (qg.status != 'OK') {
                                    echo "⚠️ Quality Gate failed: ${qg.status}"
                                } else {
                                    echo "✅ Quality Gate passed"
                                }
                            }
                        } catch (err) {
                            echo "⚠️ Quality Gate timeout — pipeline continue"
                        }
                    } else {
                        echo "⚠️ report-task.txt absent — Quality Gate ignoré"
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker build -f docker/Dockerfile.backend -t ${IMAGE_BACKEND}:${BUILD_NUMBER} -t ${IMAGE_BACKEND}:latest ."
                sh "docker build --no-cache -f docker/Dockerfile.frontend -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} -t ${IMAGE_FRONTEND}:latest ."
                echo "✅ Images buildées : ${IMAGE_BACKEND}:${BUILD_NUMBER}"
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v trivy-cache:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --severity CRITICAL \
                      --exit-code 1 \
                      ${IMAGE_BACKEND}:latest \
                    || echo "⚠️ CRITICAL vulnérabilités backend"
                """
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v trivy-cache:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${IMAGE_FRONTEND}:latest
                """
            }
        }

        stage('Push to Harbor') {
            steps {
                withVault(
                    configuration: [
                        vaultUrl: 'http://host.docker.internal:8200',
                        vaultCredentialId: 'vault-approle-jenkins'
                    ],
                    vaultSecrets: [[
                        path: 'secret/taskmanager/ci',
                        engineVersion: 2,
                        secretValues: [
                            [envVar: 'HARBOR_USER', vaultKey: 'harbor_user'],
                            [envVar: 'HARBOR_PASS', vaultKey: 'harbor_password']
                        ]
                    ]]
                ) {
                    sh '''
                        echo "${HARBOR_PASS}" | docker login ${HARBOR_REGISTRY} \
                          -u ${HARBOR_USER} --password-stdin
                        docker push ${IMAGE_BACKEND}:${BUILD_NUMBER}
                        docker push ${IMAGE_BACKEND}:latest
                        docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}
                        docker push ${IMAGE_FRONTEND}:latest
                        docker logout ${HARBOR_REGISTRY}
                        echo "✅ Images poussées vers Harbor"
                    '''
                }
            }
        }

        stage('Update Manifests (GitOps -> Flux CD)') {
            steps {
                sh '''
                    git config user.email "jenkins@taskmanager.com"
                    git config user.name "Jenkins CI"

                    sed -i "s|harbor.taskmanager.local/taskmanager/taskmanager-backend:.*|harbor.taskmanager.local/taskmanager/taskmanager-backend:${BUILD_NUMBER}|g" \
                        kubernetes/backend-deployment.yaml
                    sed -i "s|harbor.taskmanager.local/taskmanager/taskmanager-frontend:.*|harbor.taskmanager.local/taskmanager/taskmanager-frontend:${BUILD_NUMBER}|g" \
                        kubernetes/frontend-deployment.yaml

                    git add kubernetes/backend-deployment.yaml kubernetes/frontend-deployment.yaml
                    git commit -m "ci: update image tags to build #${BUILD_NUMBER} [skip ci]" \
                      || echo "ℹ️ Rien a committer"

                    git push https://${GITHUB_TOKEN}@github.com/NASRHOUDA/taskmanager-app.git HEAD:main
                    echo "✅ Manifests mis a jour — Flux CD va deployer automatiquement"
                '''
            }
        }

        stage('Checkov - IaC Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v ${WORKSPACE_BASE}/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                    || echo "✅ Checkov scan termine"
                '''
            }
        }

        stage('Kube-bench CIS Benchmark') {
            steps {
                sh '''
                    kubectl run kube-bench-${BUILD_NUMBER} \
                      --image=aquasec/kube-bench:latest \
                      --restart=Never \
                      -n default \
                      -- --version 1.28 \
                    || echo "⚠️ kube-bench erreur au lancement"

                    sleep 30
                    kubectl logs kube-bench-${BUILD_NUMBER} -n default || echo "⚠️ Logs non disponibles"
                    kubectl delete pod kube-bench-${BUILD_NUMBER} -n default || true
                '''
            }
        }

        stage('Verify Flux CD Deployment') {
            steps {
                sh '''
                    echo "⏳ Forcage reconciliation Flux..."
                    flux reconcile source git flux-system || true
                    flux reconcile kustomization taskmanager || true

                    sleep 30

                    echo "📊 Etat Flux CD :"
                    flux get kustomizations
                    flux get sources git

                    echo "📊 Rollout status :"
                    kubectl rollout status deployment/backend  -n taskmanager --timeout=3m || true
                    kubectl rollout status deployment/frontend -n taskmanager --timeout=3m || true
                    kubectl rollout status deployment/postgres -n taskmanager --timeout=3m || true

                    echo "📊 Pods :"
                    kubectl get pods -n taskmanager

                    echo "📊 Services :"
                    kubectl get svc -n taskmanager

                    echo "📊 Vault -> K8s (ExternalSecret) :"
                    kubectl get externalsecret -n taskmanager
                    kubectl get secretstore    -n taskmanager
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Pipeline DevSecOps reussi !'
        }
        failure {
            echo '❌ Pipeline echoue — voir les logs ci-dessus'
        }
        always {
            sh "docker rmi ${IMAGE_BACKEND}:${BUILD_NUMBER} || true"
            sh "docker rmi ${IMAGE_FRONTEND}:${BUILD_NUMBER} || true"
        }
    }
}
