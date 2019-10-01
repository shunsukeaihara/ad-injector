import 'intersection-observer';
import templateCompiler from 'lodash.template';
import { TemplateExecutor } from 'lodash';

const PLACEHOLDER_CLASS: string = '.ad-injector-placeholder';

export interface FetchAdsFunc {
  (target: HTMLElement, placeholder: string): Promise<object[]>;
}


export interface OnImpressionFunc {
  (trackId: string, target: HTMLElement): Promise<undefined>;
}

export interface OnFetchErrorFunc {
  (err: Error, target: HTMLElement): void;
}

export interface AdFrameConfig {
  container: string;
  template: string;
  placeholder?: string;
  extractTrackId?(data: object): string;
  extractUrl?(data: object): string;
  buildLinkUrl?(data: object): string;
  fetchAds?: FetchAdsFunc;
  onImpression?: OnImpressionFunc;
  onFetchError?: OnFetchErrorFunc;
}

function defaultExtractTrackId(data: object): string {
  return data.toString();
}

function defaultExtractUrl(data: object): string {
  return data.toString()
}

function defaultBuildLinkUrl(_data: object): string {
  return ''
}

function defaultOnImpression(_trackId: string, _target: HTMLElement): Promise<undefined> {
  return new Promise((resolve: () => void) => {
    resolve();
  });
}

function defaultFetchAds(_target: HTMLElement, _placeholder: string): Promise<object[]> {
  return new Promise((resolve: (res: object[]) => void) => {
    resolve([]);
  });
}

function defaultOnFetchError(err: Error, target: HTMLElement): void {
  console.log(err, target);
}

interface Window {
  _adFrames: AdFrameConfig[];
}
declare let window: Window;

window._adFrames = window._adFrames || [];

function render(
  ads: object,
  target: HTMLElement | null,
  templateFn: TemplateExecutor,
  getTrackId: (data: object) => string,
  getUrl: (data: object) => string,
  buildLinkUrl: (data: object) => string,
): HTMLElement {
  const linkUrl = buildLinkUrl(ads);
  const el = target ? target : document.createElement('span');
  el.innerHTML = templateFn(Object.assign({ linkUrl }, ads));
  el.setAttribute('data-track-id', getTrackId(ads));
  el.setAttribute('data-orig-link', getUrl(ads));
  el.setAttribute('data-link-url', linkUrl);
  el.setAttribute("data-rendered", "rendered");
  return el;
}

function loadAdFrame(config: AdFrameConfig): void {
  const { container } = config;
  let { placeholder, extractTrackId, extractUrl, buildLinkUrl, fetchAds, onImpression, onFetchError } = config;
  if (!extractTrackId) {
    extractTrackId = loadAdFrame.defaults.defaultExtractTrackId
  }
  if (!extractUrl) {
    extractUrl = loadAdFrame.defaults.defaultExtractUrl
  }
  if (!buildLinkUrl) {
    buildLinkUrl = loadAdFrame.defaults.defaultBuildLinkUrl
  }
  if (!fetchAds) {
    fetchAds = loadAdFrame.defaults.defaultFetchAds
  }
  if (!onImpression) {
    onImpression = loadAdFrame.defaults.defaultOnImpression
  }
  if (!onFetchError) {
    onFetchError = loadAdFrame.defaults.defaultOnFetchError
  }

  if (!placeholder) {
    placeholder = PLACEHOLDER_CLASS;
  }
  const cElm: HTMLElement | null = document.querySelector(container);
  if (!cElm) throw new Error(`container ${container} not found.`);
  const containerElm = cElm as HTMLElement;

  let io: IntersectionObserver = new IntersectionObserver(entreis => {
    entreis.forEach(entry => {
      if (entry.intersectionRatio === 0) return;
      const target = entry.target as HTMLElement;
      const trackId = target.getAttribute('data-track-id');
      if (trackId && !target.getAttribute('data-post-impression')) {
        target.setAttribute('data-post-impression', 'true');
        onImpression!(trackId, target).catch(() => {
          target.setAttribute('data-post-impression', '');
        });
      } else if (!trackId) {
        console.error('Invalid track id.');
      }
    });
  });
  fetchAds(containerElm, placeholder).then((ads: object[]): void => {
    containerElm.querySelectorAll(placeholder!).forEach((el: Element) => {
      if (el.getAttribute("data-rendered")) return;
      let ad = ads.shift();
      if (ad) {
        const templateId = el.getAttribute('data-template-id') ? el.getAttribute('data-template-id')! : config.template
        const currentTemplate = document.querySelector(templateId);
        if (!currentTemplate) throw new Error(`template ${templateId} not found.`);
        const compiled = templateCompiler(currentTemplate!.innerHTML);
        render(ad, el as HTMLElement, compiled, extractTrackId!, extractUrl!, buildLinkUrl!)
        io.observe(el);
      }
    });
  }).catch((err: Error) => {
    onFetchError!(err, containerElm);
  });
}

loadAdFrame.defaults = {
  defaultExtractTrackId,
  defaultExtractUrl,
  defaultBuildLinkUrl,
  defaultOnImpression,
  defaultFetchAds,
  defaultOnFetchError
}

function init(): void {
  window._adFrames.forEach(loadAdFrame);
  window._adFrames = [];
}

init();

export default {
  loadAdFrame,
};
