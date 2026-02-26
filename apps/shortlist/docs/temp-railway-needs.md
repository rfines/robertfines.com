Railway deployment steps for apps/shortlist:

1. Railway — Create the shortlist service
In the Railway dashboard for your project:

New Service → Empty Service, name it shortlist

2. Railway — Create a PostgreSQL database service
In the same Railway project:

New Service → Database → PostgreSQL
Railway creates a standalone PostgreSQL service with connection variables available on its Variables tab.

3. Wire the DATABASE_URL into shortlist via a Reference Variable
In the shortlist service → Variables tab → "Add Variable Reference":

- Variable name: DATABASE_URL
- Reference: select the PostgreSQL service → DATABASE_URL

Railway injects it automatically (no copy-paste needed). The value will look like
${{Postgres.DATABASE_URL}} in the shortlist service's variable list.

Append ?connection_limit=5 to the value if you want to cap the pool size
(edit the reference variable and append it directly to the resolved value).

4. Set remaining environment variables on the shortlist service
In the shortlist service → Variables, add:

Variable              Value
AUTH_SECRET           run: openssl rand -base64 32
NEXTAUTH_URL          https://shortlist.robertfines.me
GOOGLE_CLIENT_ID      from Google Cloud Console
GOOGLE_CLIENT_SECRET  from Google Cloud Console
ALLOWED_EMAILS        your email (e.g. robert@example.com)
AWS_ACCESS_KEY_ID     your AWS key
AWS_SECRET_ACCESS_KEY your AWS secret
AWS_REGION            e.g. us-east-1
S3_BUCKET_NAME        your bucket name
ANTHROPIC_API_KEY     your Anthropic key

5. Configure Build and Start commands on the shortlist service
In the shortlist service → Settings → Build & Deploy:

Build command:
pnpm install --frozen-lockfile && pnpm --filter shortlist exec prisma migrate deploy && pnpm --filter shortlist build

Start command:
pnpm --filter shortlist start

6. Add GitHub Actions variable
In your repo → Settings → Variables → Actions, add:

RAILWAY_SHORTLIST_SERVICE = shortlist (exact name from Railway dashboard)
This is already wired into deploy.yml.

7. Google OAuth — add redirect URI
In Google Cloud Console → APIs & Services → Credentials → your OAuth client:

Add https://shortlist.robertfines.me/api/auth/callback/google as an authorized redirect URI

8. DNS
At your registrar, add a CNAME:

shortlist → your Railway-provided domain for the service
Railway will provision a free TLS cert automatically once the CNAME propagates.

9. Deploy
Push to main — the CI/CD pipeline will deploy via the shortlist step in deploy.yml.
