/* Thin typed wrapper around the Mixpanel CDN global */

declare global {
  interface Window {
    mixpanel: {
      track: (event: string, properties?: Record<string, unknown>) => void;
      identify: (id: string) => void;
      people: { set: (props: Record<string, unknown>) => void };
    };
  }
}

const mp = () => window.mixpanel;

export const analytics = {
  track(event: string, props?: Record<string, unknown>) {
    mp()?.track(event, props);
  },
  identify(id: string) {
    mp()?.identify(id);
  },
  setUser(props: Record<string, unknown>) {
    mp()?.people?.set(props);
  },
};
