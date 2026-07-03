<div align="center">

# 📋 Task Manager App

### Application full-stack de gestion de tâches avec pipeline DevSecOps complet

[![CI/CD](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939?style=flat&logo=jenkins&logoColor=white)](#)
[![Docker](https://img.shields.io/badge/Docker-houdanasr-2496ED?style=flat&logo=docker&logoColor=white)](https://hub.docker.com/u/houdanasr)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Minikube-326CE5?style=flat&logo=kubernetes&logoColor=white)](#)
[![SonarQube](https://img.shields.io/badge/Quality%20Gate-Passed-success?style=flat&logo=sonarqube&logoColor=white)](#)
[![Tests](https://img.shields.io/badge/Tests-41%2F41%20✅-brightgreen?style=flat)](#)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#)

</div>

---

## 📖 Table des matières

- [À propos](#-à-propos)
- [Architecture](#-architecture)
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Pipeline DevSecOps](#-pipeline-devsecops)
- [Structure de la base de données](#-structure-de-la-base-de-données)
- [API Endpoints](#-api-endpoints)
- [Sécurité](#-sécurité)
- [Installation & démarrage](#-installation--démarrage)
- [Déploiement Kubernetes](#-déploiement-kubernetes)
- [Statistiques du projet](#-statistiques-du-projet)
- [Roadmap](#-roadmap)
- [Auteur](#-auteur)

---

## 🎯 À propos

**Task Manager App** est une application web complète de gestion de tâches (To-Do List) construite avec une architecture professionnelle découplée : un **backend Node.js/Express** exposant une API REST, un **frontend React** moderne et responsive, et une base de données **PostgreSQL**.

Le projet intègre un pipeline **CI/CD DevSecOps** complet avec Jenkins, intégrant la sécurité à chaque étape (SAST, scan de secrets, scan de vulnérabilités, audit de conformité Kubernetes) et un déploiement automatisé sur **Kubernetes** via **GitOps (ArgoCD)**.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     UTILISATEUR FINAL                     │
└───────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│  FRONTEND — React + Nginx                    Port: 80     │
│  Dashboard, authentification, gestion des tâches          │
└───────────────────────────┬────────────────────────────────┘
                             │ API REST (JWT)
                             ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND — Node.js + Express                 Port: 5000   │
│  12 endpoints REST, authentification JWT + Google OAuth   │
└───────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│  BASE DE DONNÉES — PostgreSQL + Sequelize ORM             │
│  Table Users  ──1:N──  Table Tasks                        │
└──────────────────────────────────────────────────────────┘
```

**Déploiement Kubernetes (namespace `taskmanager`)** : 2 réplicas backend, 2 réplicas frontend, 1 instance PostgreSQL avec volume persistant (PVC), exposition via un service `LoadBalancer` (Nginx).

---

## ✨ Fonctionnalités

### 👤 Gestion des utilisateurs

| Fonctionnalité | Description |
|---|---|
| Inscription | Création de compte par email / mot de passe |
| Connexion | Authentification locale ou via Google OAuth |
| Google OAuth | Connexion en un clic avec un compte Google |
| Profil | Gestion des informations personnelles |

### ✅ Gestion des tâches

| Fonctionnalité | Description |
|---|---|
| Créer | Ajouter une tâche (titre, description, priorité) |
| Lire | Consulter toutes ses tâches |
| Modifier | Mettre à jour titre, description, statut, priorité |
| Supprimer | Effacer une tâche |
| Statuts | `pending`, `in_progress`, `completed` |
| Priorités | `low`, `medium`, `high` |

> Chaque utilisateur ne voit et ne gère que ses propres tâches.

---

## 🛠️ Stack technique

| Catégorie | Technologies |
|---|---|
| **Frontend** | React, Nginx |
| **Backend** | Node.js, Express, Passport.js |
| **Base de données** | PostgreSQL, Sequelize ORM |
| **Authentification** | JWT, bcrypt, Google OAuth 2.0 |
| **CI/CD** | Jenkins, Docker, Kubernetes (Minikube), ArgoCD |
| **Sécurité** | Helmet, CORS, Rate limiting, express-validator |
| **Tests** | Jest (41 tests unitaires) |
| **Qualité & Sécurité du code** | SonarQube, Semgrep, Gitleaks, OWASP, Trivy, Checkov, kube-bench |
| **Monitoring** | Prometheus, Grafana |

---

## 🔄 Pipeline DevSecOps

Le pipeline Jenkins (`taskmanager-pipeline`) exécute automatiquement les étapes suivantes à chaque `git push` :

```
┌─────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ 1. Source   │ → │ 2. Analyse        │ → │ 3. Build & scan     │
│    & CI     │   │    statique       │   │    images Docker    │
│             │   │                   │   │                     │
│ GitHub      │   │ Gitleaks          │   │ Build backend       │
│ Jenkins     │   │ Semgrep (SAST)    │   │ Trivy (0 CRITICAL)  │
│ Jest (41)   │   │ SonarQube         │   │ Build frontend      │
│ npm audit   │   │ Coverage lcov     │   │ Trivy (0 HIGH)      │
└─────────────┘   └──────────────────┘   └─────────┬───────────┘
                                                     │
        ┌────────────────────────────────────────────┘
        ▼
┌─────────────┐   ┌──────────────────┐   ┌────────────────────┐
│ 4. GitOps   │ → │ 5. Déploiement    │ → │ 6. Sécurité infra   │
│   (ArgoCD)  │   │    Kubernetes     │   │    & résultat       │
│             │   │                   │   │                     │
│ Update      │   │ Pods backend x2   │   │ Checkov (231 pass)  │
│ manifests   │   │ Pods frontend x2  │   │ kube-bench CIS      │
│ git push    │   │ PostgreSQL + PVC  │   │ (36 pass)           │
│ ArgoCD sync │   │ Nginx LoadBalancer│   │ Prometheus/Grafana  │
└─────────────┘   └──────────────────┘   └────────────────────┘
```

### Étapes détaillées

| Étape | Outil | Rôle |
|---|---|---|
| Build & orchestration | **Jenkins** | Orchestre l'ensemble du pipeline |
| Tests unitaires | **Jest** | 41 tests, couverture lcov |
| Détection de secrets | **Gitleaks** | Scan du code source pour secrets exposés |
| Analyse SAST | **Semgrep** | Détection de vulnérabilités dans le code |
| Qualité du code | **SonarQube** | Quality Gate, dette technique, couverture |
| Dépendances | **npm audit / OWASP Dependency-Check** | Vulnérabilités dans les dépendances |
| Scan d'images | **Trivy** | Vulnérabilités CVE dans les images Docker |
| Registry | **Docker Hub** | Stockage des images versionnées |
| GitOps | **ArgoCD** | Synchronisation automatique avec le cluster |
| Conformité IaC | **Checkov** | Bonnes pratiques sur les manifests Kubernetes |
| Benchmark CIS | **kube-bench** | Audit de sécurité du cluster Kubernetes |
| Monitoring | **Prometheus + Grafana** | Métriques et dashboards en temps réel |

---

## 🗄️ Structure de la base de données

### Table `Users`

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | Email de l'utilisateur |
| `password` | VARCHAR(255) | NULLABLE | Mot de passe hashé (bcrypt) |
| `name` | VARCHAR(255) | NOT NULL | Nom affiché |
| `provider` | ENUM | DEFAULT `'local'` | Type d'authentification (`local` / `google`) |
| `providerId` | VARCHAR(255) | NULLABLE | ID Google OAuth |
| `createdAt` | TIMESTAMPTZ | NOT NULL | Date de création |
| `updatedAt` | TIMESTAMPTZ | NOT NULL | Date de modification |

**Index** : `PRIMARY KEY (id)`, `UNIQUE (email)`

### Table `Tasks`

| Colonne | Type | Contrainte | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Identifiant unique |
| `title` | VARCHAR(255) | NOT NULL | Titre de la tâche |
| `description` | TEXT | NULLABLE | Description détaillée |
| `status` | ENUM | DEFAULT `'pending'` | `pending` / `in_progress` / `completed` |
| `priority` | ENUM | DEFAULT `'medium'` | `low` / `medium` / `high` |
| `userId` | UUID | FOREIGN KEY | Référence vers `Users(id)` |
| `createdAt` | TIMESTAMPTZ | NOT NULL | Date de création |
| `updatedAt` | TIMESTAMPTZ | NOT NULL | Date de modification |

**Relation** : `userId → Users(id)` avec `ON DELETE CASCADE` (1 utilisateur → N tâches)

---

## 📡 API Endpoints

| Méthode | Endpoint | Description | Auth requise |
|---|---|---|---|
| `POST` | `/api/auth/register` | Inscription | ❌ |
| `POST` | `/api/auth/login` | Connexion | ❌ |
| `GET` | `/api/auth/google` | Connexion via Google | ❌ |
| `GET` | `/api/tasks` | Lister les tâches de l'utilisateur | ✅ |
| `POST` | `/api/tasks` | Créer une tâche | ✅ |
| `PUT` | `/api/tasks/:id` | Modifier une tâche | ✅ |
| `DELETE` | `/api/tasks/:id` | Supprimer une tâche | ✅ |

---

## 🔒 Sécurité

- ✅ Mots de passe hashés avec **bcrypt**
- ✅ Authentification par **tokens JWT**
- ✅ Protection contre les attaques XSS (**Helmet**)
- ✅ **Rate limiting** contre le brute-force
- ✅ Validation des données entrantes (**express-validator**)
- ✅ **CORS** configuré
- ✅ Scan de vulnérabilités automatisé (**Trivy**, **OWASP**, **Semgrep**)
- ✅ Détection de secrets dans le code (**Gitleaks**)
- ✅ Audit de conformité Kubernetes (**Checkov**, **kube-bench**)

---

## 🚀 Installation & démarrage

### Prérequis

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (ou via Docker)

### Avec Docker Compose

```bash
git clone https://github.com/NASRHOUDA/taskmanager-app.git
cd taskmanager-app
docker-compose -f docker/docker-compose.yml up --build
```

### En local (sans Docker)

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (dans un autre terminal)
cd frontend
npm install
npm start
```

### Variables d'environnement requises (backend)

```env
DB_HOST=localhost
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## ☸️ Déploiement Kubernetes

```bash
# Créer le namespace et les ressources
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/configmap.yaml
kubectl apply -f kubernetes/secrets.yaml

# Déployer l'application
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/backend-service.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend-service.yaml
kubectl apply -f kubernetes/postgres-deployment.yaml

# Vérifier le déploiement
kubectl get pods -n taskmanager
kubectl get svc -n taskmanager
```

---

## 📊 Statistiques du projet

| Métrique | Valeur |
|---|---|
| Tests unitaires | 41/41 ✅ |
| Quality Gate SonarQube | OK ✅ |
| Vulnérabilités CRITICAL (images) | 0 ✅ |
| Conformité IaC (Checkov) | 231 checks passés |
| Conformité CIS (kube-bench) | 36 checks passés |
| Pods Kubernetes | 5 (2 backend + 2 frontend + 1 postgres) |

---

## 🗺️ Roadmap

- [ ] Partage de tâches entre utilisateurs
- [ ] Catégories et tags personnalisés
- [ ] Notifications par email
- [ ] Export PDF / CSV
- [ ] Mode hors ligne (PWA)
- [ ] Vue calendrier interactive

---

## 👩‍💻 Auteur

**Houda Nasr**
[GitHub @NASRHOUDA](https://github.com/NASRHOUDA) · [Docker Hub @houdanasr](https://hub.docker.com/u/houdanasr)

---

<div align="center">

⭐ Si ce projet vous a été utile, n'hésitez pas à lui mettre une étoile !

</div>
# Test
