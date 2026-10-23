// Base44 preview wrapper around this project's own Vite config.
//
// It lives in the environment repository (never in the project source), is
// copied into the unpacked workspace at container start and loaded with
// `vite --config vite.preview.config.mjs`.
//
// The project's vite.config.js is imported below and stays authoritative: this
// wrapper only adds what the Base44 preview needs, and only while
// BASE44_PREVIEW_MODE is exactly "1". With the variable unset or any other
// value the project's own config is used unchanged.

import baseConfig from './vite.config.js';

export default async function previewViteConfig(env) {
  const resolved =
    (typeof baseConfig === 'function' ? await baseConfig(env) : baseConfig) ?? {};
  const config = { ...resolved };

  if (process.env.BASE44_PREVIEW_MODE !== '1') {
    return config;
  }

  // The preview proxy reaches the dev server as <port>-<sandbox id>.<domain>
  // and forwards that Host header, so the sandbox host domain has to be
  // allowed. The sandbox id rotates, so the wildcard form is used.
  const allowedHosts = new Set(['localhost', '127.0.0.1']);
  const configured = config.server?.allowedHosts;
  if (Array.isArray(configured)) {
    configured.forEach((host) => allowedHosts.add(host));
  } else if (typeof configured === 'string') {
    allowedHosts.add(configured);
  }
  if (process.env.BASE44_SANDBOX_HOST_DOMAIN) {
    allowedHosts.add(`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`);
  }

  config.server = {
    ...(config.server ?? {}),
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: configured === true ? true : [...allowedHosts],
  };

  return config;
}
