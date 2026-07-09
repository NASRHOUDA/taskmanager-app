#!/bin/bash
# Test standalone depuis Git Bash - à lancer directement, hors Jenkins
export MSYS_NO_PATHCONV=1

set +e
NS=taskmanager
JOB=zap-scan-job
REPORT_DIR="./zap-report"
mkdir -p "$REPORT_DIR"

echo "== 1. Nettoyage =="
kubectl delete job $JOB -n $NS --ignore-not-found --wait=true
sleep 3

echo "== 2. Création du Job =="
cat <<EOF | kubectl apply -f -
apiVersion: batch/v1
kind: Job
metadata:
  name: $JOB
  namespace: $NS
spec:
  backoffLimit: 0
  activeDeadlineSeconds: 300
  template:
    spec:
      restartPolicy: Never
      containers:
      - name: zap
        image: zaproxy/zap-stable
        command: ["zap-baseline.py"]
        args:
          - "-t"
          - "http://frontend-service/"
          - "-r"
          - "zap_report.html"
          - "-T"
          - "5"
          - "-I"
        workingDir: /zap/wrk
        volumeMounts:
        - name: wrk
          mountPath: /zap/wrk
      volumes:
      - name: wrk
        emptyDir: {}
