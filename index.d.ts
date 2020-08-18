import 'intersection-observer';
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
declare function defaultExtractTrackId(data: object): string;
declare function defaultExtractUrl(data: object): string;
declare function defaultBuildLinkUrl(_data: object): string;
declare function defaultOnImpression(_trackId: string, _target: HTMLElement): Promise<void>;
declare function defaultFetchAds(_target: HTMLElement, _placeholder: string): Promise<object[]>;
declare function defaultOnFetchError(err: Error, target: HTMLElement): void;
export declare function loadAdFrame(config: AdFrameConfig): void;
export declare namespace loadAdFrame {
    var defaults: {
        defaultExtractTrackId: typeof defaultExtractTrackId;
        defaultExtractUrl: typeof defaultExtractUrl;
        defaultBuildLinkUrl: typeof defaultBuildLinkUrl;
        defaultOnImpression: typeof defaultOnImpression;
        defaultFetchAds: typeof defaultFetchAds;
        defaultOnFetchError: typeof defaultOnFetchError;
    };
}
export {};
