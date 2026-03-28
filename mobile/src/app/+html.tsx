import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="description" content="Opturna — Sistema de decisión financiera inteligente" />
        <meta name="theme-color" content="#080808" />
        <meta property="og:title" content="Opturna" />
        <meta property="og:description" content="Tu asistente financiero inteligente" />
        <meta property="og:type" content="website" />
        <title>Opturna</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: webStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const webStyles = `
* { box-sizing: border-box; }

body {
  background-color: #080808;
  margin: 0;
  padding: 0;
}

/* Mobile: full screen */
@media (max-width: 767px) {
  body {
    background-color: #080808;
  }
}

/* Desktop: center app like a phone frame */
@media (min-width: 768px) {
  body {
    background-color: #080808;
    background-image:
      radial-gradient(ellipse 60% 40% at 20% 50%, rgba(74,222,128,0.04) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 80% 50%, rgba(74,222,128,0.03) 0%, transparent 70%);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    min-height: 100dvh;
  }

  #root {
    width: 393px;
    height: 852px;
    max-height: 95vh;
    max-height: 95dvh;
    border-radius: 44px;
    overflow: hidden;
    position: relative;
    box-shadow:
      0 0 0 1px rgba(74,222,128,0.15),
      0 0 0 10px rgba(255,255,255,0.04),
      0 0 60px rgba(74,222,128,0.08),
      0 40px 120px rgba(0,0,0,0.9);
  }

  /* Phone notch bar top */
  #root::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 34px;
    background: #000;
    border-radius: 20px;
    z-index: 9999;
    pointer-events: none;
  }
}

/* Large desktop: bigger frame */
@media (min-width: 1200px) {
  #root {
    width: 430px;
    height: 932px;
  }
}
`;
