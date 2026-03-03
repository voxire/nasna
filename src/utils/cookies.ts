export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
};

export const setCookie = (name: string, value: string, maxAgeSeconds?: number): void => {
  let cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
  if (maxAgeSeconds !== undefined) {
    cookie += `; max-age=${maxAgeSeconds}`;
  }
  document.cookie = cookie;
};

export const deleteCookie = (name: string): void => {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Strict`;
};
