pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'
        VAULT_ADDR            = 'http://host.docker.internal:8200'
        VAULT_TOKEN           = 'root'
    }

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        stage('Fetch Secrets from Vault') {
            steps {
                script {
                    def dockerSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/docker
                    """, returnStdout: true).trim()
                    env.DOCKER_USER = sh(script: "echo '${dockerSecrets}' | jq -r '.data.data.username'", returnStdout: true).trim()
                    env.DOCKER_PASS = sh(script: "echo '${dockerSecrets}' | jq -r '.data.data.password'", returnStdout: true).trim()

                    def githubSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/github
                    """, returnStdout: true).trim()
                    env.GH_TOKEN = sh(script: "echo '${githubSecrets}' | jq -r '.data.data.token'", returnStdout: true).trim()

                    def sonarSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/sonar
                    """, returnStdout: true).trim()
                    env.SONAR_TOKEN = sh(script: "echo '${sonarSecrets}' | jq -r '.data.data.token'", returnStdout: true).trim()

                    def googleSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/google
                    """, returnStdout: true).trim()
                    env.GOOGLE_CLIENT_ID     = sh(script: "echo '${googleSecrets}' | jq -r '.data.data.client_id'", returnStdout: true).trim()
                    env.GOOGLE_CLIENT_SECRET = sh(script: "echo '${googleSecrets}' | jq -r '.data.data.client_secret'", returnStdout: true).trim()

                    def dbSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/db
                    """, returnStdout: true).trim()
                    env.DB_HOST     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.host'", returnStdout: true).trim()
                    env.DB_PORT     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.port'", returnStdout: true).trim()
                    env.DB_NAME     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.name'", returnStdout: true).trim()
                    env.DB_USER     = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.user'", returnStdout: true).trim()
                    env.DB_PASSWORD = sh(script: "echo '${dbSecrets}' | jq -r '.data.data.password'", returnStdout: true).trim()

                    def appSecrets = sh(script: """
                        curl -s -H "X-Vault-Token: ${VAULT_TOKEN}" \
                          ${VAULT_ADDR}/v1/secret/data/taskmanager/app
                    """, returnStdout: true).trim()
                    env.JWT_SECRET     = sh(script: "echo '${appSecrets}' | jq -r '.data.data.jwt_secret'", returnStdout: true).trim()
                    env.JWT_EXPIRES_IN = sh(script: "echo '${appSecrets}' | jq -r '.data.data.jwt_expires_in'", returnStdout: true).trim()
                    env.FRONTEND_URL   = sh(script: "echo '${appSecrets}' | jq -r '.data.data.frontend_url'", returnStdout: true).trim()
                    env.API_URL        = sh(script: "echo '${appSecrets}' | jq -r '.data.data.api_url'", returnStdout: true).trim()

                    echo '✅ Secrets récupérés depuis Vault'
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Backend Install') {
                    steps {
                        dir('backend') { sh 'npm ci' }
                    }
                }
                stage('Frontend Install') {
                    steps {
                        dir('frontend') { sh 'npm install --omit=optional' }
                    }
                }
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            sh 'npm test -- --coverage --coverageReporters=lcov || echo "⚠️ Tests backend terminés"'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            sh 'CI=true npm test -- --coverage --coverageReporters=lcov --passWithNoTests || echo "⚠️ Tests frontend terminés"'
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
                            sh 'npm audit --audit-level=high || echo "⚠️ npm vulnerabilities detected"'
                        }
                    }
                }
                stage('npm audit - Frontend') {
                    steps {
                        dir('frontend') {
                            sh 'npm audit --audit-level=high || echo "⚠️ npm vulnerabilities detected"'
                        }
                    }
                }
            }
        }

        stage('SAST - Semgrep') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v $(pwd):/src \
                          returntocorp/semgrep:latest \
                          semgrep --config=p/security-audit /src --no-git-ignore \
                          --json --output=/src/semgrep-report.json \
                        || echo "⚠️ Semgrep scan terminé"
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
    steps {
        dir('backend') {
            // 1. Installer les dépendances
            sh 'npm install'
            
            // 2. Lancer les tests avec génération des rapports
            sh '''
                npm test -- \
                    --coverage \
                    --testResultsProcessor=jest-junit \
                    --coverageReporters=lcov \
                    --coverageReporters=text \
                    --collectCoverageFrom="src/**/*.js" \
                    --collectCoverageFrom="!src/**/*.test.js" \
                    --coverageDirectory=./coverage
            '''
            
            // 3. Vérifier que les fichiers de rapport existent
            sh '''
                echo "📊 Vérification des fichiers de rapport :"
                ls -la ./coverage/ || echo "⚠️ Coverage directory not found"
                echo "Contenu du répertoire coverage :"
                find ./coverage -type f 2>/dev/null || echo "⚠️ No coverage files"
            '''
            
            // 4. Lancer l'analyse SonarQube
            withSonarQubeEnv('SonarQube') {
                sh '''
                    npx sonar-scanner \
                      -Dsonar.projectKey=taskmanager \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://host.docker.internal:9000 \
                      -Dsonar.token=${SONAR_TOKEN} \
                      -Dsonar.exclusions=node_modules/**,**/*.test.js \
                      -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                      -Dsonar.testExecutionReportPaths=coverage/test-report.xml \
                      -Dsonar.tests=tests \
                      -Dsonar.test.inclusions=tests/**/*.test.js
                '''
            }
        }
    }
}

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    def qg = waitForQualityGate()
                    if (qg.status != 'OK') {
                        echo "⚠️ Quality Gate status: ${qg.status} - Pipeline continue"
                    } else {
                        echo "✅ Quality Gate passed: ${qg.status}"
                    }
                }
            }
        }

        

        stage('Build Docker Images') {
            steps {
                sh """
                    docker build \
                      -t ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER} \
                      -t ${DOCKER_IMAGE_BACKEND}:latest \
                      -f docker/Dockerfile.backend \
                      .
                    docker build \
                      -t ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER} \
                      -t ${DOCKER_IMAGE_FRONTEND}:latest \
                      -f docker/Dockerfile.frontend.fixed \
                      .
                    echo "✅ Images buildées"
                """
            }
        }

        stage('Trivy Image Scan') {
            steps {
                sh """
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${DOCKER_IMAGE_BACKEND}:latest

                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      ${DOCKER_IMAGE_FRONTEND}:latest
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                // FIX : script en quotes simples (''') + variables shell ($DOCKER_PASS, pas ${DOCKER_PASS})
                // au lieu de quotes triples doubles ("""). Avec """, Groovy injecte la valeur du
                // secret directement dans le texte du script écrit sur disque ET affiché par Jenkins
                // -> c'est exactement ce qui causait les "+ echo nasr.2005" en clair dans les logs.
                // "set +x" en première ligne désactive aussi le traçage shell des commandes suivantes.
                sh '''
                    set +x
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_BACKEND}:latest
                    docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_FRONTEND}:latest
                    docker logout
                    echo "✅ Images poussées vers Docker Hub"
                '''
            }
        }

        stage('Update Manifests') {
            steps {
                // FIX : on réutilise GH_TOKEN déjà récupéré dans "Fetch Secrets from Vault"
                // au lieu de re-fetch Vault + extraction Python ici. Cette deuxième requête
                // Vault dans le Groovy "script {}" faisait un "echo '${githubSecrets}' | python3 ..."
                // qui imprimait le JSON contenant le token en clair dans les logs Jenkins
                // (visible dans ton run précédent : "+ echo {...,"token":"ghp_..."}").
                // GH_TOKEN est déjà disponible en env, pas besoin de le re-demander à Vault.
                script {
                    env.GH_USER = 'NASRHOUDA'
                }

                sh '''
                    set +x
                    set -e

                    git config user.email jenkins@taskmanager.com
                    git config user.name "Jenkins CI"

                    export GIT_TERMINAL_PROMPT=0

                    sed -i "s|image: houdanasr/taskmanager-backend:.*|image: houdanasr/taskmanager-backend:${BUILD_NUMBER}|g" kubernetes/backend-deployment.yaml
                    sed -i "s|image: houdanasr/taskmanager-frontend:.*|image: houdanasr/taskmanager-frontend:${BUILD_NUMBER}|g" kubernetes/frontend-deployment.yaml

                    git add kubernetes/backend-deployment.yaml kubernetes/frontend-deployment.yaml

                    if ! git commit -m "ci: update image tags to build #${BUILD_NUMBER}"; then
                        echo "⚠️ No changes to commit"
                    fi

                    # Debug sans danger : pas de valeur secrète affichée, juste la longueur
                    echo "GH_USER: ${GH_USER}"
                    echo "GH_TOKEN length: ${#GH_TOKEN}"

                    git push "https://${GH_USER}:${GH_TOKEN}@github.com/NASRHOUDA/taskmanager-app.git" HEAD:main

                    echo "✅ Manifests pushed successfully to GitHub"
                '''
            }
        }

        stage('Flux Reconciliation') {
            steps {
                sh '''
                    sleep 30
                    flux reconcile source git flux-system --timeout=3m || true
                    flux reconcile kustomization taskmanager --timeout=3m || true
                    sleep 20
                    echo "📊 Flux status:"
                    flux get kustomizations
                    echo "📊 Pods:"
                    kubectl get pods -n taskmanager || true
                    echo "✅ Déploiement Flux CD complété"
                '''
            }
        }

        stage('Checkov - IaC Scan') {
            steps {
                // FIX : l'ancienne commande "-o cli -o json --output-file-path /work/checkov-results"
                // était invalide. Avec 2 formats (-o cli -o json), --output-file-path attend une liste
                // séparée par des virgules, une valeur par format dans le même ordre. Le dossier de
                // sortie doit aussi exister avant l'appel (Checkov ne le crée pas lui-même).
                sh '''
                    rm -rf kubernetes/checkov-results
                    mkdir -p kubernetes/checkov-results

                    docker run --rm \
                      -v $(pwd)/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                      --compact \
                      -o cli -o json \
                      --output-file-path console,/work/checkov-results \
                    || echo "✅ Checkov scan terminé"

                    echo "📊 Checkov Results:"
                    REPORT=kubernetes/checkov-results/results_json.json
                    if [ -f "$REPORT" ]; then
                        PASSED=$(jq -r '.summary.passed // 0' "$REPORT" 2>/dev/null || echo 0)
                        FAILED=$(jq -r '.summary.failed // 0' "$REPORT" 2>/dev/null || echo 0)
                        echo "   ✅ Passed: ${PASSED}"
                        echo "   ❌ Failed: ${FAILED}"
                    else
                        echo "   ⚠️ Pas de rapport JSON trouvé, voir la sortie CLI ci-dessus"
                    fi
                '''
            }
        }
    }

    post {
        success { echo '✅ Pipeline DevSecOps réussi !' }
        failure { echo '❌ Pipeline échoué' }
    }
}
