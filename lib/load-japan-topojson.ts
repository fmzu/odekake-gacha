import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";

export type JapanFeatureCollection = FeatureCollection<Geometry, { nam_ja?: string; nam?: string }>;

/**
 * public/maps/japan.topojson を fetch し、GeoJSON FeatureCollection に変換する。
 */
export async function loadJapanTopoJson(
  url: string = "/maps/japan.topojson",
): Promise<JapanFeatureCollection> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load topojson: ${res.status}`);
  }
  const topology = (await res.json()) as Topology;
  const firstKey = Object.keys(topology.objects)[0];
  const object = topology.objects[firstKey] as GeometryCollection;
  const geo = feature(topology, object) as unknown as FeatureCollection<
    Geometry,
    { nam_ja?: string; nam?: string }
  >;
  // feature が Feature を返す可能性もある場合に備えて FeatureCollection に整形
  const features: Feature<Geometry, { nam_ja?: string; nam?: string }>[] =
    Array.isArray((geo as FeatureCollection).features)
      ? (geo as FeatureCollection<Geometry, { nam_ja?: string; nam?: string }>)
          .features
      : [geo as unknown as Feature<Geometry, { nam_ja?: string; nam?: string }>];
  return { type: "FeatureCollection", features };
}
