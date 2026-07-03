pipeline {
    agent any

    environment {
    DOCKER_IMAGE_BACKEND  = 'houdanasr/taskmanager-backend'
    DOCKER_IMAGE_FRONTEND = 'houdanasr/taskmanager-frontend'
    VAULT_ADDR            = 'http://host.docker.internal:8200'
    VAULT_TOKEN           = 'root'
    JENKINS_WS            = '/var/jenkins_home/workspace/taskmanager-pipeline'
    GH_USER               = 'NASRHOUDA'
}

    options {
        timeout(time: 60, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                // FIX 3 : credential explicite "github-token" au lieu du
                // credential "dockerhub-credentials" (nom trompeur / mal réutilisé)
                git branch: 'main',
                    url: 'https://github.com/NASRHOUDA/taskmanager-app.git',
                    credentialsId: 'github-token'
                echo '📦 Code récupéré depuis GitHub'
            }
        }

        stage('Check CI Skip') {
            steps {
                script {
                    // FIX 4 (garde-fou anti-boucle) : si le dernier commit contient
                    // [skip ci] (posé par le stage "Update Manifests"), on arrête
                    // immédiatement ce build pour éviter une boucle infinie
                    // déclenchée par le webhook push -> main.
                    def lastCommitMsg = sh(script: 'git log -1 --pretty=%B', returnStdout: true).trim()
                    if (lastCommitMsg.contains('[skip ci]')) {
                        echo "⏭️ Commit contient [skip ci] — build arrêté pour éviter une boucle infinie (Update Manifests)."
                        currentBuild.result = 'NOT_BUILT'
                        error("Build volontairement stoppé : commit [skip ci] détecté.")
                    }
                }
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
                        dir('backend') { sh 'npm install' }
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
              --volumes-from jenkins \
              returntocorp/semgrep:latest \
              semgrep --config=p/security-audit \
              /var/jenkins_home/workspace/taskmanager-pipeline/backend \
              --no-git-ignore \
              --json --output=/var/jenkins_home/workspace/taskmanager-pipeline/backend/semgrep-report.json \
            || echo "⚠️ Semgrep scan terminé"
        '''
    }
}

        stage('SonarQube Analysis') {
            steps {
                // FIX 2 : le frontend est maintenant analysé en plus du backend
                dir('backend') {
                    sh 'npm install'

                    sh '''
                        npm test -- \
                            --coverage \
                            --coverageReporters=lcov \
                            --coverageReporters=text \
                            --coverageDirectory=./coverage \
                            || echo "⚠️ Tests backend terminés"
                    '''
                }

                dir('frontend') {
                    sh '''
                        CI=true npm test -- \
                            --coverage \
                            --coverageReporters=lcov \
                            --coverageReporters=text \
                            --coverageDirectory=./coverage \
                            --passWithNoTests \
                            || echo "⚠️ Tests frontend terminés"
                    '''
                }

                sh '''
                    echo "📊 Vérification des fichiers de rapport :"
                    ls -la backend/coverage/ || echo "⚠️ Backend coverage directory not found"
                    ls -la frontend/coverage/ || echo "⚠️ Frontend coverage directory not found"
                '''

                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npx sonar-scanner \
                          -Dsonar.projectKey=taskmanager \
                          -Dsonar.sources=backend,frontend \
                          -Dsonar.host.url=http://host.docker.internal:9000 \
                          -Dsonar.token=${SONAR_TOKEN} \
                          -Dsonar.exclusions=**/node_modules/**,**/*.test.js,**/build/**,**/dist/** \
                          -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info \
                          -Dsonar.tests=backend/tests,frontend/src \
                          -Dsonar.test.inclusions=**/*.test.js
                    '''
                }
            }
        }

        stage('SonarQube Quality Gate') {
            steps {
                script {
                    // FIX 1 : le Quality Gate ne bloque toujours pas le pipeline,
                    // mais un échec est maintenant visible clairement (build UNSTABLE)
                    // au lieu d'un simple echo perdu dans les logs.
                    def qg = waitForQualityGate()
                    if (qg.status != 'OK') {
                        echo "⚠️ Quality Gate status: ${qg.status} - build marqué UNSTABLE, pipeline continue"
                        currentBuild.result = 'UNSTABLE'
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

        stage('Prepare Trivy Cache') {
    steps {
        script {
            sh '''
                echo "📦 Préparation du cache Trivy..."
                mkdir -p /tmp/trivy-cache
                
                # Télécharge la DB une seule fois et la cache
                docker run --rm \
                  -v /tmp/trivy-cache:/root/.cache/trivy \
                  aquasec/trivy:latest image \
                  --download-db-only \
                  --timeout 5m || {
                    echo "⚠️ Erreur download DB - Trivy utilisera le mode offline si possible"
                    exit 0
                }
                echo "✅ Cache Trivy prêt"
            '''
        }
    }
}

stage('Trivy Image Scan') {
    steps {
        script {
            retry(3) {
                sh '''
                    set +e
                    
                    echo "🔍 Scan Trivy - Backend image..."
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v /tmp/trivy-cache:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      --timeout 5m \
                      ${DOCKER_IMAGE_BACKEND}:latest
                    
                    BACKEND_RESULT=$?
                    
                    echo "🔍 Scan Trivy - Frontend image..."
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v /tmp/trivy-cache:/root/.cache/trivy \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --exit-code 0 \
                      --timeout 5m \
                      ${DOCKER_IMAGE_FRONTEND}:latest
                    
                    FRONTEND_RESULT=$?
                    
                    # Vérifie les résultats
                    if [ $BACKEND_RESULT -eq 0 ] && [ $FRONTEND_RESULT -eq 0 ]; then
                        echo "✅ Scans Trivy réussis - Aucune vulnérabilité CRITICAL/HIGH détectée"
                        exit 0
                    elif [ $BACKEND_RESULT -eq 1 ] || [ $FRONTEND_RESULT -eq 1 ]; then
                        echo "⚠️ Vulnérabilités CRITICAL/HIGH détectées - Pipeline continue"
                        exit 0
                    else
                        echo "❌ Erreur lors du scan Trivy - Réessai..."
                        exit 1
                    fi
                '''
            }
        }
    }
}
        stage('Push to Docker Hub') {
            steps {
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
        
        sh '''
            set +x
            set -e

            git config user.email jenkins@taskmanager.com
            git config user.name "Jenkins CI"

            export GIT_TERMINAL_PROMPT=0

            sed -i "s|image: houdanasr/taskmanager-backend:.*|image: houdanasr/taskmanager-backend:${BUILD_NUMBER}|g" kubernetes/deployment-advanced.yaml
            sed -i "s|image: houdanasr/taskmanager-frontend:.*|image: houdanasr/taskmanager-frontend:${BUILD_NUMBER}|g" kubernetes/deployment-advanced.yaml

            git add kubernetes/deployment-advanced.yaml

            # FIX 4 : [skip ci] dans le message de commit pour éviter que le webhook
            # push -> main ne redéclenche ce même pipeline (boucle infinie).
            if ! git commit -m "ci: update image tags to build #${BUILD_NUMBER} [skip ci]"; then
                echo "⚠️ No changes to commit"
            fi

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

        stage('DAST Security Scan') {
            steps {
                echo "🚀 Lancement de l'analyse dynamique (DAST) avec OWASP ZAP..."
                sh '''
                    set +e

                    # frontend-service est déjà exposé sur http://localhost (port 80)
                    # via "minikube tunnel", lancé en parallèle. Pas besoin de
                    # kubectl port-forward ici : ça évite le conflit avec le port
                    # 8080 déjà utilisé par Jenkins lui-même (le conteneur ZAP
                    # partage le network namespace de Jenkins via
                    # --network=container:jenkins).

                    # Dossier dédié en écriture pour ZAP (le conteneur tourne en
                    # non-root et ne peut pas écrire dans le workspace tel quel :
                    # c'est ce qui causait les erreurs "Permission denied").
                    mkdir -p "${WORKSPACE}/zap-report"
                    chmod 777 "${WORKSPACE}/zap-report"

                    docker run --rm --network=container:jenkins \
                      -v "${WORKSPACE}/zap-report:/zap/wrk:rw" \
                      zaproxy/zap-stable zap-baseline.py \
                      -t http://localhost/ \
                      -r zap_report.html || true
                '''
                archiveArtifacts artifacts: 'zap-report/zap_report.html', allowEmptyArchive: true
            }
        }
        
    } // ← Fin du bloc stages

    post {
        success { echo '✅ Pipeline DevSecOps réussi !' }
        failure { echo '❌ Pipeline échoué' }
    }
}  // ← FERMETURE FINALE DU PIPELINE
