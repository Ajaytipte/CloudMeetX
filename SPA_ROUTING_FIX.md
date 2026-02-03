# Fixing 404 Errors on Refresh (SPA Routing)

In Single Page Applications (React + Vite), handling routing happens on the client side. When you visit a deep link like `/meeting/123`, the server (Amplify) tries to find a file named `meeting/123` and fails, giving a 404.

You need to tell Amplify to serve `index.html` for **all** navigation requests, so React Router can handle them.

## ✅ How to Configure Redirects in AWS Amplify

1.  **Log in to AWS Console**.
2.  Go to **AWS Amplify**.
3.  Select your app (**CloudMeetX**).
4.  In the left sidebar, click **Rewrites and redirects**.
5.  Click **Manage redirects**.
6.  Click **Add rewrite**.
7.  Fill in the form EXACTLY as follows:

| Field | Value |
|---|---|
| **Source address** | `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>` |
| **Target address** | `/index.html` |
| **Type** | `200 (Rewrite)` |

### Explanation of the Regex
The "Source address" above is a regular expression that matches **any path that does NOT have a file extension** (like `.css`, `.js`, `.png`).
*   `/meeting/123` -> Matches (No extension) -> Rewrites to `/index.html` (Correct!)
*   `/assets/style.css` -> Does NOT match -> Serves actual file (Correct!)

### Simpler Option (Catch-All)
If the regex above is too complex, you can use the simpler catch-all rule, but **make sure it is at the BOTTOM of your list**:

| Field | Value |
|---|---|
| **Source address** | `/*` |
| **Target address** | `/index.html` |
| **Type** | `200 (Rewrite)` |

**Note:** The regex version is generally safer because it ensures actual assets (images, scripts) don't get accidentally rewritten if one is missing.

## 🚀 After Saving
1.  Save the changes.
2.  Wait 1-2 minutes.
3.  Refresh your app on a deep link (e.g., `/meeting/123`). It should now load the app instead of a 404 error.
