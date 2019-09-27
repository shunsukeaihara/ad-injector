import 'intersection-observer';
import 'polyfill-queryselector';
export interface FetchAdsFunc {
    (target: HTMLElement, placeholder: string, onsuccess: (target: HTMLElement, ads: object[]) => void, onerror: (target: HTMLElement) => void): void;
}
export interface OnImpressionFunc {
    (trackId: string, target: HTMLElement, onerror: (target: HTMLElement) => void): void;
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
}
declare function defaultExtractTrackId(data: object): string;
declare function defaultExtractUrl(data: object): string;
declare function defaultBuildLinkUrl(_data: object): string;
declare function defaultOnImpression(_trackId: string, _target: HTMLElement, _onerror: (target: HTMLElement) => void): void;
declare function defaultFetchAds(target: HTMLElement, _placeholder: string, onsuccess: (target: HTMLElement, ads: object[]) => void, _onerror: (target: HTMLElement) => void): void;
declare function loadAdFrame(config: AdFrameConfig): void;
declare namespace loadAdFrame {
    var defaults: {
        defaultExtractTrackId: typeof defaultExtractTrackId;
        defaultExtractUrl: typeof defaultExtractUrl;
        defaultBuildLinkUrl: typeof defaultBuildLinkUrl;
        defaultOnImpression: typeof defaultOnImpression;
        defaultFetchAds: typeof defaultFetchAds;
    };
}
declare const _default: {
    loadAdFrame: typeof loadAdFrame;
};
export default _default;
