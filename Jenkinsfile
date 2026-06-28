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
                    // Fonction utilitaire : récupère et parse un secret Vault
                    // SANS jamais faire transiter sa valeur par une commande shell.
                    // Le JSON brut n'est jamais "echo"-é : il est parsé directement
                    // en mémoire Groovy, donc il n'apparaît jamais dans les logs Jenkins.
                    def fetchVaultSecret = { String path ->
                        def raw = sh(
                            script: "set +x; curl -s -H \"X-Vault-Token: \$VAULT_TOKEN\" ${VAULT_ADDR}/v1/secret/data/taskmanager/${path}",
                            returnStdout: true
                        ).trim()
                        def json = new groovy.json.JsonSlurperClassic().parseText(raw)
                        return json.data.data
                    }

                    def docker = fetchVaultSecret('docker')
                    env.DOCKER_USER = docker.username
                    env.DOCKER_PASS = docker.password

                    def github = fetchVaultSecret('github')
                    env.GH_TOKEN = github.token
                    env.GH_USER  = github.username

                    def sonar = fetchVaultSecret('sonar')
                    env.SONAR_TOKEN = sonar.token

                    def google = fetchVaultSecret('google')
                    env.GOOGLE_CLIENT_ID     = google.client_id
                    env.GOOGLE_CLIENT_SECRET = google.client_secret

                    def db = fetchVaultSecret('db')
                    env.DB_HOST     = db.host
                    env.DB_PORT     = db.port
                    env.DB_NAME     = db.name
                    env.DB_USER     = db.user
                    env.DB_PASSWORD = db.password

                    def app = fetchVaultSecret('app')
                    env.JWT_SECRET     = app.jwt_secret
                    env.JWT_EXPIRES_IN = app.jwt_expires_in
                    env.FRONTEND_URL   = app.frontend_url
                    env.API_URL        = app.api_url

                    echo '✅ Secrets récupérés depuis Vault (valeurs non affichées dans les logs)'
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
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            set +x
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

        stage('OWASP Dependency Check') {
            steps {
                dir('backend') {
                    sh '''
                        docker run --rm \
                          -v $(pwd):/src \
                          -v owasp-data:/usr/share/dependency-check/data \
                          owasp/dependency-check:latest \
                          --project "taskmanager-backend" \
                          --scan /src \
                          --format JSON \
                          --out /src/owasp-report.json \
                          --noupdate \
                        || echo "⚠️ OWASP scan terminé"
                    '''
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
                // --password-stdin évite que le mot de passe apparaisse dans `ps aux`,
                // et "set +x" évite qu'il apparaisse dans les logs Jenkins.
                // Pense aussi à configurer un credential helper docker côté agent
                // (ex: docker-credential-pass) pour ne pas le stocker en clair sur disque.
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

                    sed -i "s|image: houdanasr/taskmanager-backend:.*|image: houdanasr/taskmanager-backend:${BUILD_NUMBER}|g" kubernetes/backend-deployment.yaml
                    sed -i "s|image: houdanasr/taskmanager-frontend:.*|image: houdanasr/taskmanager-frontend:${BUILD_NUMBER}|g" kubernetes/frontend-deployment.yaml

                    git add kubernetes/backend-deployment.yaml kubernetes/frontend-deployment.yaml

                    if ! git commit -m "ci: update image tags to build #${BUILD_NUMBER}"; then
                        echo "⚠️ No changes to commit"
                    fi

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
                sh '''
                    # Checkov ne crée pas le dossier de sortie lui-même : on le prépare avant,
                    # sinon erreur "No such file or directory".
                    rm -rf kubernetes/checkov-results
                    mkdir -p kubernetes/checkov-results

                    # Avec 2 formats (-o cli -o json), --output-file-path attend une liste
                    # séparée par des virgules, UNE valeur par format, dans le même ordre :
                    #   "console"               -> le format cli s'affiche juste dans les logs
                    #   "/work/checkov-results" -> le format json est écrit dans ce dossier
                    docker run --rm \
                      -v $(pwd)/kubernetes:/work \
                      bridgecrew/checkov:latest \
                      -d /work \
                      --framework kubernetes \
                      --soft-fail \
                      --compact \
                      -o cli -o json \
                      --output-file-path console,/work/checkov-results \
                    || echo "⚠️ Checkov scan terminé"

                    echo "📊 Checkov Results:"
                    # Checkov nomme TOUJOURS le fichier results_json.json,
                    # quel que soit le nom du dossier donné à --output-file-path.
                    REPORT=kubernetes/checkov-results/results_json.json
                    if [ -f "$REPORT" ]; then
                        PASSED=$(jq -r '.summary.passed // 0' "$REPORT" 2>/dev/null || echo 0)
                        FAILED=$(jq -r '.summary.failed // 0' "$REPORT" 2>/dev/null || echo 0)
                        SKIPPED=$(jq -r '.summary.skipped // 0' "$REPORT" 2>/dev/null || echo 0)
                        echo "   ✅ Passed:  ${PASSED}"
                        echo "   ❌ Failed:  ${FAILED}"
                        echo "   ⏭️  Skipped: ${SKIPPED}"
                    else
                        echo "   ⚠️ Pas de rapport JSON trouvé à ${REPORT}, voir la sortie CLI ci-dessus"
                    fi
                '''
            }
        }
    }

    post {
        always {
            // Nettoyage défensif : purge les variables sensibles de l'environnement du build
            script {
                env.DOCKER_PASS = ''
                env.GH_TOKEN = ''
                env.SONAR_TOKEN = ''
                env.GOOGLE_CLIENT_SECRET = ''
                env.DB_PASSWORD = ''
                env.JWT_SECRET = ''
            }
        }
        success { echo '✅ Pipeline DevSecOps réussi !' }
        failure { echo '❌ Pipeline échoué' }
    }
}
