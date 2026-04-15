# Snippet App — Setup Guide (Start Here)

Work through these steps in order. Each section ends with a checkpoint so you know you're ready to move on.

---

## Step 1 — Install tools on your computer

You need three tools installed locally before anything else.

### Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (the left button)
3. Run the installer with all defaults
4. Verify: open Terminal and run `node -v` — you should see a version number like `v20.x.x`

### Docker Desktop
1. Go to https://www.docker.com/products/docker-desktop
2. Download for your operating system (Mac or Windows)
3. Install and open it — it runs in your menu bar/taskbar
4. Verify: in Terminal run `docker -v` — you should see a version number

### Google Cloud CLI (gcloud)
1. Go to https://cloud.google.com/sdk/docs/install
2. Follow the instructions for your OS
3. After install, run `gcloud init` in Terminal — it will open a browser to log in with your Google account
4. Verify: run `gcloud -v` — you should see version info

### Git
1. Go to https://git-scm.com/downloads
2. Download and install for your OS
3. Verify: run `git -v` in Terminal

**✅ Checkpoint:** `node -v`, `docker -v`, `gcloud -v`, and `git -v` all return version numbers without errors.

---

## Step 2 — Create a Google Cloud account and project

1. Go to https://console.cloud.google.com
2. Sign in with your Google account (or create one)
3. If prompted, accept the Terms of Service
4. Click **Select a project** at the top → **New Project**
5. Name it something like `snippet-app` → click **Create**
6. **Enable billing:** In the left sidebar go to **Billing** → link a credit card
   - GCP requires a card on file, but this app will cost very little (a few dollars/month at most)
   - New accounts get $300 in free credits

7. Note your **Project ID** — it's shown on the project dashboard (looks like `snippet-app-123456`). You'll need this throughout.

**✅ Checkpoint:** You can see your project in the GCP console and billing is enabled.

---

## Step 3 — Enable GCP APIs

In the GCP console, search for each of these in the search bar and click **Enable**:

- `Cloud Run API`
- `Cloud SQL Admin API`
- `Cloud Speech-to-Text API`
- `Vertex AI API`
- `Artifact Registry API`
- `Cloud Build API`

Or run this single command in Terminal after `gcloud init`:
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  speech.googleapis.com \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  --project=YOUR_PROJECT_ID
```
(Replace `YOUR_PROJECT_ID` with your actual project ID)

**✅ Checkpoint:** All 6 APIs show as "Enabled" in the GCP console under **APIs & Services → Enabled APIs**.

---

## Step 4 — Create a Cloud SQL database

1. In GCP console, search for **Cloud SQL** → click **Create Instance**
2. Choose **PostgreSQL**
3. Choose **Enterprise** edition → **Sandbox** preset (cheapest, fine for this app)
4. Set:
   - **Instance ID:** `snippet-db`
   - **Password:** create a strong password and save it somewhere safe
   - **Region:** choose one close to you (e.g. `us-central1`)
   - **Database version:** PostgreSQL 15
5. Click **Create Instance** — this takes about 5 minutes
6. Once created, click on the instance → **Databases** tab → **Create Database**
   - Name it: `snippets`
7. Go to **Users** tab → note the default `postgres` user

**✅ Checkpoint:** Cloud SQL instance is running (green checkmark) and a database named `snippets` exists.

---

## Step 5 — Create a Firebase project

1. Go to https://console.firebase.google.com
2. Click **Add project**
3. When asked to select a Google Cloud project, pick the same `snippet-app` project you just created — this links them together
4. Disable Google Analytics (not needed) → click **Create Project**

### Enable Authentication
1. In Firebase console, click **Authentication** in the left sidebar
2. Click **Get started**
3. Under **Sign-in providers**, enable **Google** → toggle it on → save
4. Also enable **Email/Password** as a fallback

### Enable Storage
1. Click **Storage** in the left sidebar
2. Click **Get started**
3. Choose **Start in production mode** → pick the same region as your Cloud SQL instance → **Done**

### Get your Firebase config keys
1. Click the gear icon (⚙️) next to **Project Overview** → **Project settings**
2. Scroll down to **Your apps** → click the **</>** (web) icon
3. Register the app with nickname `snippet-app-web`
4. Copy the `firebaseConfig` object — it looks like this. Save it somewhere:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### Get your Firebase Admin credentials
1. Still in Project settings → click **Service accounts** tab
2. Click **Generate new private key** → **Generate Key**
3. A JSON file downloads — save this somewhere safe (you'll need it for the backend)

**✅ Checkpoint:** Firebase has Authentication (Google + Email/Password enabled), Storage, and you have the `firebaseConfig` object and the downloaded service account JSON file.

---

## Step 6 — Set up local tools

### Authenticate gcloud with your project
```bash
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

### Create an Artifact Registry repository (for Docker images)
```bash
gcloud artifacts repositories create snippet-app \
  --repository-format=docker \
  --location=us-central1 \
  --description="Snippet app container images"
```
(Change `us-central1` to your chosen region if different)

**✅ Checkpoint:** The Artifact Registry repository appears in GCP console under **Artifact Registry**.

---

## You're ready to code!

Once all 6 checkpoints above are green, come back and say **"Setup done"** and we'll generate the full Next.js application code for Phase 2.

Keep these handy for the next step:
- Your **GCP Project ID**
- Your **Cloud SQL instance connection name** (found on the Cloud SQL instance overview page — looks like `project-id:region:snippet-db`)
- Your **Cloud SQL password**
- Your **Firebase config object**
- Your **Firebase service account JSON file**
