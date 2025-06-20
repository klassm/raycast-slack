import { Cache } from "@raycast/api";

const cache = new Cache();

export type CacheProvider<T> = () => Promise<T>;

export interface CacheOptions {
	expirationMillis: number;
}

interface CacheData<T> {
	lastModified: number;
	data: T;
}

function loadJson<T>(cacheKey: string): T | undefined {
	try {
		const cachedData = cache.get(cacheKey);
		return cachedData === undefined ? undefined : JSON.parse(cachedData);
	} catch (e) {
		console.log("Cannot parse data", e);
		return undefined;
	}
}

async function loadData<T>(
	cacheKey: string,
	provider: CacheProvider<T>,
	options: CacheOptions,
): Promise<T> {
	const parsedData: CacheData<T> | undefined = loadJson(cacheKey);

	const now = Date.now();
	if (
		parsedData !== undefined &&
		now - parsedData.lastModified < options.expirationMillis
	) {
		return parsedData.data;
	}

	const data = await provider();
	updateCache(cacheKey, data);
	return data;
}

export function updateCache<T>(cacheKey: string, newData: T) {
	const now = Date.now();
	cache.set(
		cacheKey,
		JSON.stringify({
			lastModified: now,
			data: newData,
		} as CacheData<T>),
	);
}

export async function getCachedData<T>(
	key: string,
	provider: CacheProvider<T>,
	options: CacheOptions,
): Promise<T> {
	return loadData(key, provider, options);
}
