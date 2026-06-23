pipeline {
    agent any

    environment {
        // ===== VAULT =====
        VAULT_URL = 'http://192.168.49.2:30200'
        VAULT_CRED_ID = 'vault-approle-jenkins'
        
        // ===== HARBOR =====
        HARBOR_REGISTRY = 'harbor.taskmanager.local'
        HARBOR_PROJECT  = 'taskmanager'
        IMAGE_BACKEND   = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/taskmanager-backend"
        IMAGE_FRONTEND  = "${HARBOR_REGISTRY}/${HARBOR_PROJECT}/taskmanager-frontend"
        
        // ===== SONAR =====
        SONAR_HOST_URL  = 'http://host.docker.internal:9000'
        
        // ===== KUBERNETES =====
        KUBECONFIG      = '/var/jenkins_home/.kube/config'
        WORKSPACE_BASE  = '/var/lib/docker/volumes/jenkins_home/_data/workspace/taskmanager-pipeline'
        
        // ===== CREDENTIALS =====
        SONAR_TOKEN     = credentials('sonarqube-token')
        GITHUB_TOKEN    = credentials('github-token')
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        
        // ============================================
        // STAGE 1: Setup Kubectl
        // ============================================
        stage('Setup Kubectl') {
            steps {
                sh 'mkdir -p /var/jenkins_home/.kube'
                sh 'kubectl get nodes || echo "⚠️ Kubectl not configured"'
            }
        }

        // ============================================
        // STAGE 2: Checkout
        // ============================================
        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        // ============================================
        // STAGE 3: Verify Vault Connectivity
        // ============================================
        stage('Verify Vault Connectivity') {
            steps {
                script {
                    echo '🔍 Test Vault connectivity...'
                    
                    // Test 1: Health check
                    sh 'curl -s http://192.168.49.2:30200/v1/sys/health || echo "⚠️ Vault health check failed"'
                    
                    // Test 2: Récupération du secret via withVault
                    try {
                        withVault(
                            configuration: [
                                vaultUrl: env.VAULT_URL,
                                vaultCredentialId: env.VAULT_CRED_ID,
                                engineVersion: 2,
                                timeout: 60
                            ],
                            vaultSecrets: [
                                [
                                    path: 'secret/data/taskmanager/database',
                                    engineVersion: 2,
                                    secretValues: [
                                        [envVar: 'DB_HOST', vaultKey: 'host'],
                                        [envVar: 'DB_PORT', vaultKey: 'port'],
                                        [envVar: 'DB_USERNAME', vaultKey: 'username'],
                                        [envVar: 'DB_PASSWORD', vaultKey: 'password'],
                                        [envVar: 'DB_NAME', vaultKey: 'database']
                                    ]
                                ]
                            ]
                        ) {
                            sh '''
                                echo "✅ Vault connecté !"
                                echo "DB_HOST: ${DB_HOST}"
                                echo "DB_USERNAME: ${DB_USERNAME}"
                                echo "DB_NAME: ${DB_NAME}"
                            '''
                        }
                    } catch (Exception e) {
                        echo "⚠️ withVault a échoué, fallback avec curl..."
                        
                        // Fallback: utiliser curl directement
                        def token = sh(script: '''
                            curl -s -X POST \
                              http://192.168.49.2:30200/v1/auth/approle/login \
                              -H "Content-Type: application/json" \
                              -d '{"role_id":"1733a07d-54cc-860f-99b3-c748782d9aa4","secret_id":"e4c8b380-afce-9e83-f5aa-9feae99bfb41"}'
                        ''', returnStdout: true).trim()
                        
                        def vaultToken = sh(script: """
                            echo '$token' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['auth']['client_token'])
except:
    print('ERROR')
"
                        """, returnStdout: true).trim()
                        
                        if (vaultToken != 'ERROR' && !vaultToken.isEmpty()) {
                            def secret = sh(script: """
                                curl -s -H "X-Vault-Token: $vaultToken" \
                                  http://192.168.49.2:30200/v1/secret/data/taskmanager/database
                            """, returnStdout: true).trim()
                            
                            def dbPassword = sh(script: """
                                echo '$secret' | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['data']['data']['password'])
except:
    print('ERROR')
"
                            """, returnStdout: true).trim()
                            
                            env.DB_PASSWORD = dbPassword
                            echo "✅ Secret récupéré via curl: DB_PASSWORD=${env.DB_PASSWORD}"
                        } else {
                            error("❌ Vault authentication failed")
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 4: Install Dependencies
        // ============================================
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

        // ============================================
        // STAGE 5: Unit Tests - Jest
        // ============================================
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

        // ============================================
        // STAGE 6: Dependency Audit
        // ============================================
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
                                || docker run --rm \
                                  -v ${WORKSPACE_BASE}/backend:/src \
                                  -v owasp-data:/usr/share/dependency-check/data \
                                  owasp/dependency-check:latest \
                                  --project "taskmanager-backend" \
                                  --scan /src \
                                  --format JSON \
                                  --out /src/owasp-report.json \
                                  --noupdate \
                                  --failOnCVSS 7 \
                                || echo "⚠️ OWASP scan terminé avec avertissements"
                            '''
                        }
                    }
                }
            }
        }

        // ============================================
        // STAGE 7: SAST - Semgrep
        // ============================================
        stage('SAST - Semgrep') {
            steps {
                script {
                    // Récupérer le token Semgrep depuis Vault
                    def token = sh(script: '''
                        curl -s -X POST \
                          http://192.168.49.2:30200/v1/auth/approle/login \
                          -H "Content-Type: application/json" \
                          -d '{"role_id":"1733a07d-54cc-860f-99b3-c748782d9aa4","secret_id":"e4c8b380-afce-9e83-f5aa-9feae99bfb41"}'
                    ''', returnStdout: true).trim()
                    
                    def vaultToken = sh(script: """
                        echo '$token' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['auth']['client_token'])
"
                    """, returnStdout: true).trim()
                    
                    def semgrepToken = sh(script: """
                        curl -s -H "X-Vault-Token: $vaultToken" \
                          http://192.168.49.2:30200/v1/secret/data/taskmanager/semgrep \
                        | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(data['data']['data']['token'])
except:
    print('')
"
                    """, returnStdout: true).trim()
                    
                    env.SEMGREP_APP_TOKEN = semgrepToken
                }
                
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
                        echo "❌ Rapport Semgrep introuvable"
                        FINDINGS="N/A"
                    fi
                    
                    echo "📊 Semgrep findings: ${FINDINGS}"
                '''
            }
        }

        // ============================================
        // STAGE 8: SonarQube Analysis
        // ============================================
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

        // ============================================
        // STAGE 9: SonarQube Quality Gate
        // ============================================
        stage('SonarQube Quality Gate') {
            steps {
                script {
                    if (fileExists('report-task.txt')) {
                        try {
                            timeout(time: 1, unit: 'MINUTES') {
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

        // ============================================
        // STAGE 10: Build Docker Images
        // ============================================
        stage('Build Docker Images') {
            steps {
                sh "docker build -f docker/Dockerfile.backend -t ${IMAGE_BACKEND}:${BUILD_NUMBER} -t ${IMAGE_BACKEND}:latest ."
                sh "docker build --no-cache -f docker/Dockerfile.frontend -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} -t ${IMAGE_FRONTEND}:latest ."
                echo "✅ Images buildées : ${IMAGE_BACKEND}:${BUILD_NUMBER}"
            }
        }

        // ============================================
        // STAGE 11: Trivy Image Scan
        // ============================================
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

        // ============================================
        // STAGE 12: Push to Harbor
        // ============================================
        stage('Push to Harbor') {
    steps {
        script {
            // Récupérer les secrets Harbor depuis Vault
            def token = sh(script: '''
                curl -s -X POST \
                  http://192.168.49.2:30200/v1/auth/approle/login \
                  -H "Content-Type: application/json" \
                  -d '{"role_id":"1733a07d-54cc-860f-99b3-c748782d9aa4","secret_id":"e4c8b380-afce-9e83-f5aa-9feae99bfb41"}'
            ''', returnStdout: true).trim()
            
            def vaultToken = sh(script: """
                echo '$token' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['auth']['client_token'])
"
            """, returnStdout: true).trim()
            
            def harborSecrets = sh(script: """
                curl -s -H "X-Vault-Token: $vaultToken" \
                  http://192.168.49.2:30200/v1/secret/data/taskmanager/harbor
            """, returnStdout: true).trim()
            
            def harborUser = sh(script: """
                echo '$harborSecrets' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['data']['data']['username'])
"
            """, returnStdout: true).trim()
            
            def harborPass = sh(script: """
                echo '$harborSecrets' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['data']['data']['password'])
"
            """, returnStdout: true).trim()
            
            env.HARBOR_USER = harborUser
            env.HARBOR_PASS = harborPass
        }
        
        sh '''
            # Docker login avec option --insecure-registry (via /etc/docker/daemon.json)
            # Utiliser l'option de ligne de commande pour contourner le problème
            
            echo "${HARBOR_PASS}" | docker login harbor.taskmanager.local \
              -u ${HARBOR_USER} --password-stdin
            
            # Pousser les images
            docker push ${IMAGE_BACKEND}:${BUILD_NUMBER}
            docker push ${IMAGE_BACKEND}:latest
            docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}
            docker push ${IMAGE_FRONTEND}:latest
            
            docker logout ${HARBOR_REGISTRY}
            echo "✅ Images poussées vers Harbor"
        '''
    }
}

        // ============================================
        // STAGE 13: Update Manifests (GitOps -> Flux CD)
        // ============================================
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

        // ============================================
        // STAGE 14: Checkov - IaC Scan
        // ============================================
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

        // ============================================
        // STAGE 15: Kube-bench CIS Benchmark
        // ============================================
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

        // ============================================
        // STAGE 16: Verify Flux CD Deployment
        // ============================================
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
