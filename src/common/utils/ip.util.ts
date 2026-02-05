import { isIP } from 'node:net';

import { Request } from 'express';

export function getClientIp(req: Request): string | undefined {
  const h = (k: string) => (req.headers[k] as string | undefined)?.trim();

  const candidates = [
    h('cf-connecting-ip'),
    h('true-client-ip'),
    h('x-client-ip'),
    h('x-real-ip'),
    h('x-forwarded-for')?.split(',')[0]?.trim(),
    req.ip,
    req.socket.remoteAddress,
  ];

  for (const c of candidates) {
    if (!c) {
      continue;
    }

    const ip = c.replace(/^::ffff:/, '');
    if (isIP(ip)) {
      return ip;
    }
  }
}
