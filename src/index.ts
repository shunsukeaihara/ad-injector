import 'intersection-observer';
import 'polyfill-queryselector';
import templateCompiler from 'lodash.template';
import { TemplateExecutor } from 'lodash';

const PLACEHOLDER_CLASS: string = '.ad-injector-placeholder';

export interface FetchAdsFunc {
  (target: HTMLElement, placeholder: string,
    onsuccess: (target: HTMLElement, ads: object[]) => void,
    onerror: (target: HTMLElement) => void): void;
}

export interface OnImpressionFunc {
  (trackId: string, target: HTMLElement,
    onerror: (target: HTMLElement) => void): void
}

export interface AdFrameConfig {
  container: string;
  template: string;
  placeholder?: string;
  extractTrackId?(data: object): string;
  extractUrl?(data: object): string;
  buildLinkUrl?(data: object): string;
  fetchAds?: FetchAdsFunc,
  onImpression?: OnImpressionFunc
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

function defaultOnImpression(_trackId: string,
  _target: HTMLElement,
  _onerror: (target: HTMLElement) => void): void {
}

function defaultFetchAds(target: HTMLElement, _placeholder: string,
  onsuccess: (target: HTMLElement, ads: object[]) => void,
  _onerror: (target: HTMLElement) => void): void {
  onsuccess(target, [])
}

interface Window {
  _adFrames: AdFrameConfig[];
}
declare let window: Window;

window._adFrames = window._adFrames || [];

function isIE6(): boolean {
  let ua = navigator.userAgent.toLowerCase();
  let ver = navigator.appVersion.toLowerCase();
  return (ua.indexOf("msie") != -1 && ver.indexOf("msie 6.") != -1)
}

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
  let { placeholder, extractTrackId, extractUrl, buildLinkUrl, fetchAds, onImpression } = config;
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
  if (!placeholder) {
    placeholder = PLACEHOLDER_CLASS;
  }

  const cElm: HTMLElement | null = document.querySelector(container);
  if (!cElm) throw new Error(`container ${container} not found.`);
  const containerElm = cElm as HTMLElement;

  let io: IntersectionObserver | null = null;
  if (!isIE6()) {
    // ie7, ie8でもだめな可能性があるので、その時はObject.definePropertyのチェックをする
    // 一応polyfillはie7対応と言い張っている
    io = new IntersectionObserver(entreis => {
      entreis.forEach(entry => {
        if (entry.intersectionRatio === 0) return;
        const target = entry.target as HTMLElement;
        const trackId = target.getAttribute('data-track-id');
        if (trackId && !target.getAttribute('data-post-impression')) {
          target.setAttribute('data-post-impression', 'true');
          onImpression!(trackId, target,
            (target: Element): void => {
              target.setAttribute('data-post-impression', '');
            });
        } else if (!trackId) {
          console.error('Invalid track id.');
        }
      });
    });
  }
  fetchAds(containerElm, placeholder,
    (target: HTMLElement, ads: object[]) => {
      document.querySelectorAll('#' + target.id + ' ' + placeholder).forEach(el => {
        if (el.getAttribute("data-rendered")) return;
        let ad = ads.shift();
        if (ad) {
          const templateId = el.getAttribute('data-template-id') ? el.getAttribute('data-template-id')! : config.template
          const currentTemplate = document.querySelector(templateId);
          if (!currentTemplate) throw new Error(`template ${templateId} not found.`);
          const compiled = templateCompiler(currentTemplate!.innerHTML);
          render(ad, el as HTMLElement, compiled, extractTrackId!, extractUrl!, buildLinkUrl!)
          if (io) {
            io.observe(el);
          } else {
            const trackId = extractTrackId!(ad);
            if (trackId && !el.getAttribute('data-post-impression')) {
              onImpression!(trackId, el as HTMLElement, (target: HTMLElement): void => {
                target.setAttribute('data-post-impression', '');
              })
            }
          }
        } else {
          // prepare not found
          console.log("not renderd");
        }
      })
    },
    (_err: any) => {
      // prepare request error
    }
  );
}

loadAdFrame.defaults = {
  defaultExtractTrackId,
  defaultExtractUrl,
  defaultBuildLinkUrl,
  defaultOnImpression,
  defaultFetchAds,
}

function init(): void {
  window._adFrames.forEach(loadAdFrame);
  window._adFrames = [];
}

init();

export default {
  loadAdFrame,
};
