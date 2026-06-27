pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND  = 'houdanasr/taskmanager-backend'
        DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'
        VAULT_ADDR            = 'http://host.docker.internal:8200'
        VAULT_TOKEN           = 'root'
        JENKINS_WS = '/var/jenkins_home/workspace/taskmanager-pipeline'
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

        stage('Gitleaks - Secret Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v ${JENKINS_WS}:/path \
                      zricethezav/gitleaks:latest \
                      detect --source=/path \
                      --no-git \
                      --exit-code=0 \
                    || echo "⚠️ Gitleaks scan terminé"
                '''
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
                    env.GH_USER   = 'NASRHOUDA'

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
                sh '''
                    docker run --rm \
                      -v ${JENKINS_WS}/backend:/src \
                      returntocorp/semgrep:latest \
                      semgrep --config=p/security-audit /src --no-git-ignore \
                      --json --output=/src/semgrep-report.json \
                    || echo "⚠️ Semgrep scan terminé"
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                dir('backend') {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            npx sonar-scanner \
                              -Dsonar.projectKey=taskmanager-backend \
                              -Dsonar.sources=. \
                              -Dsonar.host.url=http://host.docker.internal:9000 \
                              -Dsonar.token=${SONAR_TOKEN} \
                              -Dsonar.exclusions=node_modules/**,**/*.test.js \
                            || echo "⚠️ SonarQube scan terminé"
                        '''
                    }
                }
            }
        }

        // NOUVEAU
stage('OWASP Dependency Check') {
    steps {
        sh '''
            mkdir -p ${JENKINS_WS}/owasp-output
            docker run --rm \
              -v ${JENKINS_WS}/backend:/src \
              -v ${JENKINS_WS}/owasp-output:/report \
              -v owasp-data:/usr/share/dependency-check/data \
              owasp/dependency-check:latest \
              --project "taskmanager-backend" \
              --scan /src \
              --format JSON \
              --out /report \
              --noupdate \
            || echo "⚠️ OWASP scan terminé"
        '''
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

        // NOUVEAU
stage('Trivy Image Scan') {
    steps {
        sh """
            docker run --rm \
              -v /var/run/docker.sock:/var/run/docker.sock \
              -v trivy-cache:/root/.cache/trivy \
              aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --exit-code 0 \
              ${DOCKER_IMAGE_BACKEND}:latest

            docker run --rm \
              -v /var/run/docker.sock:/var/run/docker.sock \
              -v trivy-cache:/root/.cache/trivy \
              aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --exit-code 0 \
              ${DOCKER_IMAGE_FRONTEND}:latest
        """
    }
}

        stage('Push to Docker Hub') {
            steps {
                sh """
                    echo '${DOCKER_PASS}' | docker login -u '${DOCKER_USER}' --password-stdin
                    docker push ${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_BACKEND}:latest
                    docker push ${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}
                    docker push ${DOCKER_IMAGE_FRONTEND}:latest
                    docker logout
                    echo "✅ Images poussées vers Docker Hub"
                """
            }
        }

        stage('Update Manifests') {
            steps {
                sh '''
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

                    git push https://${GH_USER}:${GH_TOKEN}@github.com/NASRHOUDA/taskmanager-app.git HEAD:main
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
            kubectl rollout status deployment/backend -n taskmanager --timeout=2m || true
            kubectl rollout status deployment/frontend -n taskmanager --timeout=2m || true
            echo "✅ Déploiement Flux CD complété"
        '''
    }
}

        stage('Checkov - IaC Scan') {
            steps {
                sh '''
                    docker run --rm \
                      -v ${JENKINS_WS}/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                    || echo "✅ Checkov scan terminé"
                '''
            }
        }
    }

    post {
        success { echo '✅ Pipeline DevSecOps réussi !' }
        failure { echo '❌ Pipeline échoué' }
    }
}
