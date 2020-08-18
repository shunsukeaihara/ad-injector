/* eslint-disable @typescript-eslint/ban-types */
import 'intersection-observer';
import _ from 'lodash';

const PLACEHOLDER_CLASS = '.ad-injector-placeholder';

export interface FetchAdsFunc {
  (target: HTMLElement, placeholder: string): Promise<object[]>;
}

export interface OnImpressionFunc {
  (trackId: string, target: HTMLElement): Promise<void>;
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
  return data.toString();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function defaultBuildLinkUrl(_data: object): string {
  return '';
}

function defaultOnImpression(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _trackId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _target: HTMLElement
): Promise<void> {
  return new Promise((resolve: () => void) => {
    resolve();
  });
}

function defaultFetchAds(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _target: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _placeholder: string
): Promise<object[]> {
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
  templateFn: _.TemplateExecutor,
  getTrackId: (data: object) => string,
  getUrl: (data: object) => string,
  buildLinkUrl: (data: object) => string
): HTMLElement {
  const linkUrl = buildLinkUrl(ads);
  const el = target ? target : document.createElement('span');
  el.innerHTML = templateFn(Object.assign({ linkUrl }, ads));
  el.setAttribute('data-track-id', getTrackId(ads));
  el.setAttribute('data-orig-link', getUrl(ads));
  el.setAttribute('data-link-url', linkUrl);
  el.setAttribute('data-rendered', 'rendered');
  return el;
}

export function loadAdFrame(config: AdFrameConfig): void {
  const { container } = config;
  const {
    placeholder,
    extractTrackId,
    extractUrl,
    buildLinkUrl,
    fetchAds,
    onImpression,
    onFetchError,
  } = config;
  let _extractTrackId = loadAdFrame.defaults.defaultExtractTrackId;
  if (extractTrackId) {
    _extractTrackId = extractTrackId;
  }
  let _extractUrl = loadAdFrame.defaults.defaultExtractUrl;
  if (extractUrl) {
    _extractUrl = extractUrl;
  }
  let _buildLinkUrl = loadAdFrame.defaults.defaultBuildLinkUrl;
  if (buildLinkUrl) {
    _buildLinkUrl = buildLinkUrl;
  }
  let _fetchAds = loadAdFrame.defaults.defaultFetchAds;
  if (fetchAds) {
    _fetchAds = fetchAds;
  }
  let _onImpression = loadAdFrame.defaults.defaultOnImpression;
  if (onImpression) {
    _onImpression = onImpression;
  }
  let _onFetchError = loadAdFrame.defaults.defaultOnFetchError;
  if (onFetchError) {
    _onFetchError = onFetchError;
  }
  let _placeholder = PLACEHOLDER_CLASS;
  if (placeholder) {
    _placeholder = placeholder;
  }
  const cElm: HTMLElement | null = document.querySelector(container);
  if (!cElm) throw new Error(`container ${container} not found.`);
  const containerElm = cElm as HTMLElement;

  const io: IntersectionObserver = new IntersectionObserver((entreis) => {
    entreis.forEach((entry) => {
      if (entry.intersectionRatio === 0) return;
      const target = entry.target as HTMLElement;
      const trackId = target.getAttribute('data-track-id');
      if (trackId && !target.getAttribute('data-post-impression')) {
        target.setAttribute('data-post-impression', 'true');
        _onImpression(trackId, target).catch(() => {
          target.setAttribute('data-post-impression', '');
        });
      } else if (!trackId) {
        console.error('Invalid track id.');
      }
    });
  });
  _fetchAds(containerElm, _placeholder)
    .then((ads: object[]): void => {
      containerElm.querySelectorAll(_placeholder).forEach((el: Element) => {
        if (el.getAttribute('data-rendered')) return;
        const ad = ads.shift();
        if (ad) {
          const templateId = el.getAttribute('data-template-id')
            ? el.getAttribute('data-template-id')
            : config.template;
          if (!templateId) throw new Error(`templateId is null.`);
          const currentTemplate = document.querySelector(templateId);
          if (!currentTemplate)
            throw new Error(`template ${templateId} not found.`);
          const compiled = _.template(currentTemplate?.innerHTML);
          render(
            ad,
            el as HTMLElement,
            compiled,
            _extractTrackId,
            _extractUrl,
            _buildLinkUrl
          );
          io.observe(el);
        }
      });
    })
    .catch((err: Error) => {
      _onFetchError(err, containerElm);
    });
}

loadAdFrame.defaults = {
  defaultExtractTrackId,
  defaultExtractUrl,
  defaultBuildLinkUrl,
  defaultOnImpression,
  defaultFetchAds,
  defaultOnFetchError,
};

function init(): void {
  window._adFrames.forEach(loadAdFrame);
  window._adFrames = [];
}

init();
