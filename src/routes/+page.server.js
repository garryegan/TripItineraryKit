import trip from '$lib/data/balkans-2026.json';
import countries from '$lib/data/metadata/countries-europe.json';

export function load() {
  return {
    trip,
    countries
  };
}
