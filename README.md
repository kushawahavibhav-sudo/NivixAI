# NivixAI

**Your AI. Your Rules.**

NivixAI is a single-file AI chat web app built with React and Firebase. It runs in the browser, installs as a PWA, and talks to LLMs through a small backend you host.

## Features

- **Chat modes:** Nix (fast), Think (deep analysis), Study (step-by-step tutor), Dev (code), and Image generation
- **Models:** Llama 3.3 70B, Llama 3.1 8B, GPT-OSS 20B (Groq-style model IDs)
- **Sign-in:** Google and GitHub via Firebase Authentication
- **Chat sync:** signed-in chats are saved to Firestore; guests stay local
- **Memory Vault:** saved notes the assistant keeps in mind
- **Temporary chats:** nothing is saved
- **Voice:** speech input and spoken replies, with voice selection
- **Appearance:** Dark, Light and Hacker themes, custom wallpaper with automatic accent colours, and rainfall
- **Extras:** export chat as Markdown, edit and regenerate messages, usage stats, responsive mobile layout

## Project structure

```
index.html              the whole app (React + Firebase via CDN)
manifest.webmanifest    PWA manifest
icons/
  logo.png              header and favicon logo
  favicon.png
  icon-192.png
  icon-512.png
  apple-touch.png
LICENSE.md
README.md
```

## Setup

1. **Firebase:** create a project, enable Google and GitHub sign-in under Authentication, create a Firestore database, and add your site to Authentication > Settings > Authorized domains. Replace the config object in `index.html` with your own.
2. **Firestore rules:** restrict each user to their own chats:
   ```
   match /users/{uid}/chats/{chatId} {
     allow read, write: if request.auth != null && request.auth.uid == uid;
   }
   ```
3. **Backend:** the app expects two endpoints on the same origin:
   - `POST /api/chat` accepts `{ model, messages, temperature, max_tokens }` and returns an OpenAI-style `choices[0].message.content`. Keep your LLM API key on the server.
   - `POST /api/image` accepts `{ prompt }` and returns `{ image, text? }`, where `image` is a URL or data URI.
4. **Icons:** put the PNG files in `/icons/` and keep `manifest.webmanifest` at the site root.
5. **Deploy:** serve over HTTPS on any static host. A service worker is not required.

## Local development

Browser sign-in needs a real origin, so use a local server instead of opening the file directly:

```
npx serve .
```

Then add `localhost` to the Firebase authorized domains.

## License

Released under the [MIT License](LICENSE.md).
