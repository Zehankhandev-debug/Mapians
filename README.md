# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

```
MyFirstApp
├─ app
│  ├─ (tabs)
│  │  ├─ credits.tsx
│  │  ├─ help.tsx
│  │  ├─ index.tsx
│  │  ├─ profile.tsx
│  │  └─ _layout.tsx
│  ├─ available-plans.tsx
│  ├─ checkout.tsx
│  ├─ EditProfileScreen.tsx
│  ├─ esim-details
│  │  └─ [id].tsx
│  ├─ esim-qr.tsx
│  ├─ explore-plans.tsx
│  ├─ modal.tsx
│  ├─ my-esims.tsx
│  ├─ onboarding.tsx
│  ├─ PaymentHistoryScreen.tsx
│  ├─ purchase-success.tsx
│  ├─ screens
│  │  ├─ esims
│  │  │  └─ InstallationGuideScreen.tsx
│  │  └─ profile
│  │     ├─ DataCalculatorScreen.tsx
│  │     ├─ LiveChatSupportScreen.tsx
│  │     ├─ ProfileScreen.tsx
│  │     ├─ PushNotificationsScreen.tsx
│  │     └─ WhatsNewScreen.tsx
│  └─ _layout.tsx
├─ app.json
├─ assets
│  └─ images
│     ├─ favicon.png
│     ├─ fonts
│     │  ├─ Sunsive-Black.css
│     │  ├─ Sunsive-Black.eot
│     │  ├─ Sunsive-Black.html
│     │  ├─ Sunsive-Black.ttf
│     │  ├─ Sunsive-Black.woff
│     │  ├─ Sunsive-Black.woff2
│     │  ├─ Sunsive-Bold.css
│     │  ├─ Sunsive-Bold.eot
│     │  ├─ Sunsive-Bold.html
│     │  ├─ Sunsive-Bold.ttf
│     │  ├─ Sunsive-Bold.woff
│     │  ├─ Sunsive-Bold.woff2
│     │  ├─ Sunsive-ExtraBold.css
│     │  ├─ Sunsive-ExtraBold.eot
│     │  ├─ Sunsive-ExtraBold.html
│     │  ├─ Sunsive-ExtraBold.ttf
│     │  ├─ Sunsive-ExtraBold.woff
│     │  ├─ Sunsive-ExtraBold.woff2
│     │  ├─ Sunsive-Medium.css
│     │  ├─ Sunsive-Medium.eot
│     │  ├─ Sunsive-Medium.html
│     │  ├─ Sunsive-Medium.ttf
│     │  ├─ Sunsive-Medium.woff
│     │  ├─ Sunsive-Medium.woff2
│     │  ├─ Sunsive-Regular.css
│     │  ├─ Sunsive-Regular.eot
│     │  ├─ Sunsive-Regular.html
│     │  ├─ Sunsive-Regular.ttf
│     │  ├─ Sunsive-Regular.woff
│     │  ├─ Sunsive-Regular.woff2
│     │  ├─ Sunsive-SemiBold.css
│     │  ├─ Sunsive-SemiBold.eot
│     │  ├─ Sunsive-SemiBold.html
│     │  ├─ Sunsive-SemiBold.ttf
│     │  ├─ Sunsive-SemiBold.woff
│     │  └─ Sunsive-SemiBold.woff2
│     ├─ icon.png
│     ├─ logo.png
│     ├─ partial-react-logo.png
│     ├─ react-logo.png
│     ├─ react-logo@2x.png
│     ├─ react-logo@3x.png
│     └─ splash-icon.png
├─ components
│  ├─ external-link.tsx
│  ├─ haptic-tab.tsx
│  ├─ hello-wave.tsx
│  ├─ parallax-scroll-view.tsx
│  ├─ themed-text.tsx
│  ├─ themed-view.tsx
│  ├─ types
│  │  └─ api.types.ts
│  └─ ui
│     ├─ collapsible.tsx
│     ├─ icon-symbol.ios.tsx
│     └─ icon-symbol.tsx
├─ constants
│  ├─ api.ts
│  └─ theme.ts
├─ context
│  └─ AuthContext.tsx
├─ eas.json
├─ eslint.config.js
├─ hooks
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  ├─ use-theme-color.ts
│  └─ useApi.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  ├─ api.ts
│  ├─ apiClient.ts
│  └─ reset-project.js
└─ tsconfig.json

```
```
MyFirstApp
├─ app
│  ├─ (tabs)
│  │  ├─ credits.tsx
│  │  ├─ help.tsx
│  │  ├─ index.tsx
│  │  ├─ profile.tsx
│  │  └─ _layout.tsx
│  ├─ available-plans.tsx
│  ├─ checkout.tsx
│  ├─ EditProfileScreen.tsx
│  ├─ esim-details
│  │  └─ [id].tsx
│  ├─ esim-qr.tsx
│  ├─ explore-plans.tsx
│  ├─ modal.tsx
│  ├─ my-esims.tsx
│  ├─ onboarding.tsx
│  ├─ PaymentHistoryScreen.tsx
│  ├─ purchase-success.tsx
│  ├─ screens
│  │  ├─ esims
│  │  │  └─ InstallationGuideScreen.tsx
│  │  └─ profile
│  │     ├─ DataCalculatorScreen.tsx
│  │     ├─ LiveChatSupportScreen.tsx
│  │     ├─ ProfileScreen.tsx
│  │     ├─ PushNotificationsScreen.tsx
│  │     └─ WhatsNewScreen.tsx
│  └─ _layout.tsx
├─ app.json
├─ assets
│  └─ images
│     ├─ favicon.png
│     ├─ fonts
│     │  ├─ Sunsive-Black.css
│     │  ├─ Sunsive-Black.eot
│     │  ├─ Sunsive-Black.html
│     │  ├─ Sunsive-Black.ttf
│     │  ├─ Sunsive-Black.woff
│     │  ├─ Sunsive-Black.woff2
│     │  ├─ Sunsive-Bold.css
│     │  ├─ Sunsive-Bold.eot
│     │  ├─ Sunsive-Bold.html
│     │  ├─ Sunsive-Bold.ttf
│     │  ├─ Sunsive-Bold.woff
│     │  ├─ Sunsive-Bold.woff2
│     │  ├─ Sunsive-ExtraBold.css
│     │  ├─ Sunsive-ExtraBold.eot
│     │  ├─ Sunsive-ExtraBold.html
│     │  ├─ Sunsive-ExtraBold.ttf
│     │  ├─ Sunsive-ExtraBold.woff
│     │  ├─ Sunsive-ExtraBold.woff2
│     │  ├─ Sunsive-Medium.css
│     │  ├─ Sunsive-Medium.eot
│     │  ├─ Sunsive-Medium.html
│     │  ├─ Sunsive-Medium.ttf
│     │  ├─ Sunsive-Medium.woff
│     │  ├─ Sunsive-Medium.woff2
│     │  ├─ Sunsive-Regular.css
│     │  ├─ Sunsive-Regular.eot
│     │  ├─ Sunsive-Regular.html
│     │  ├─ Sunsive-Regular.ttf
│     │  ├─ Sunsive-Regular.woff
│     │  ├─ Sunsive-Regular.woff2
│     │  ├─ Sunsive-SemiBold.css
│     │  ├─ Sunsive-SemiBold.eot
│     │  ├─ Sunsive-SemiBold.html
│     │  ├─ Sunsive-SemiBold.ttf
│     │  ├─ Sunsive-SemiBold.woff
│     │  └─ Sunsive-SemiBold.woff2
│     ├─ icon.png
│     ├─ logo.png
│     ├─ partial-react-logo.png
│     ├─ react-logo.png
│     ├─ react-logo@2x.png
│     ├─ react-logo@3x.png
│     └─ splash-icon.png
├─ components
│  ├─ external-link.tsx
│  ├─ haptic-tab.tsx
│  ├─ hello-wave.tsx
│  ├─ parallax-scroll-view.tsx
│  ├─ themed-text.tsx
│  ├─ themed-view.tsx
│  ├─ types
│  │  └─ api.types.ts
│  └─ ui
│     ├─ collapsible.tsx
│     ├─ icon-symbol.ios.tsx
│     └─ icon-symbol.tsx
├─ constants
│  ├─ api.ts
│  └─ theme.ts
├─ context
│  └─ AuthContext.tsx
├─ eas.json
├─ eslint.config.js
├─ hooks
│  ├─ use-color-scheme.ts
│  ├─ use-color-scheme.web.ts
│  ├─ use-theme-color.ts
│  └─ useApi.ts
├─ package-lock.json
├─ package.json
├─ README.md
├─ scripts
│  ├─ api.ts
│  ├─ apiClient.ts
│  └─ reset-project.js
└─ tsconfig.json

```