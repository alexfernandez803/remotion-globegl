import {useMemo} from 'react';
import {useRef} from 'react';
import {cancelRender, interpolate, spring} from 'remotion';
import {useVideoConfig} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {continueRender} from 'remotion';
import {useEffect} from 'react';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {AbsoluteFill} from 'remotion';
import Globe, {GlobeMethods} from 'react-globe.gl';
import * as satellite from 'satellite.js';
import * as THREE from 'three';
import {generateDateArray, radiansToDegrees} from './utils';
import {EARTH_RADIUS_KM, SAT_SIZE} from './config';

interface SatData {
	satrec: satellite.SatRec;
	name: string;
}

const dateArray = generateDateArray(1500);
export const GlobeGlComposition = () => {
	const [handle] = useState(() => delayRender());
	const [satHandle] = useState(() => delayRender());
	const globeEl = useRef<GlobeMethods | undefined>(undefined);
	const [satData, setSatData] = useState<SatData[]>([]);
	const [globeRadius, setGlobeRadius] = useState<number | undefined>();

	const frame = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const zoomSpr = spring({
		frame,
		fps,
		config: {
			stiffness: 100,
		},
		durationInFrames: 10,
	});

	const zoom = interpolate(zoomSpr, [0, 1], [9, 3.5], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const longRotate = interpolate(frame, [11, durationInFrames], [-95, 100], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const timeMovement = interpolate(frame, [40, 160], [0, 240], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const startRadius = interpolate(
		frame,
		[20, 40],
		[EARTH_RADIUS_KM * 10, EARTH_RADIUS_KM],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	const endRadius = interpolate(
		frame,
		[200, durationInFrames],
		[EARTH_RADIUS_KM, EARTH_RADIUS_KM * 10],
		{
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		}
	);

	const startOpacity = interpolate(frame, [30, 40], [0, 0.7], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const endOpacity = interpolate(frame, [200, durationInFrames], [0, 0.7], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const fromRadius = startRadius + endRadius;
	const fromOpacity = startOpacity - endOpacity;

	useEffect(() => {
		if (globeEl.current) {
			const currentGlobe = globeEl.current as GlobeMethods;

			currentGlobe.pointOfView({
				lat: 41,
				lng: longRotate,
				altitude: zoom,
			});
			setGlobeRadius(currentGlobe.getGlobeRadius());
		}
	}, [globeEl, zoom, longRotate]);

	useEffect(() => {
		// Load satellite data
		fetch('//unpkg.com/globe.gl/example/datasets/space-track-leo.txt')
			.then((r) => r.text())
			.then((rawData) => {
				const tleData = rawData
					.replace(/\r/g, '')
					.split(/\n(?=[^12])/)
					.filter((d) => d)
					.map((tle) => tle.split('\n'));
				const satData = tleData
					.map(([name, ...tle]) => ({
						satrec: satellite.twoline2satrec(tle[0], tle[1]),
						name: name.trim().replace(/^0 /, ''),
					}))
					// Exclude those that can't be propagated
					.filter((d) =>
						Boolean(satellite.propagate(d.satrec, new Date()).position)
					)
					.slice(0, 1500);

				setSatData(satData);
				continueRender(satHandle);
			})
			.catch((err) => {
				cancelRender(err);
			});
	}, []);

	const objectsData = useMemo(() => {
		if (!satData) return [];
		const timeDate = dateArray[timeMovement];
		// Update satellite positions
		const gmst = satellite.gstime(timeDate);
		return satData.map((d) => {
			const eci = satellite.propagate(d.satrec, timeDate);
			if (eci.position) {
				const gdPos = satellite.eciToGeodetic(
					eci.position as satellite.EciVec3<number>,
					gmst
				);
				const lat = radiansToDegrees(gdPos.latitude);
				const lng = radiansToDegrees(gdPos.longitude);
				const alt = gdPos.height / fromRadius;

				return {...d, lat, lng, alt};
			}
			return d;
		});
	}, [satData, timeMovement, fromRadius]);

	const satObject = useMemo(() => {
		if (!globeRadius) return undefined;

		const satGeometry = new THREE.OctahedronGeometry(
			(SAT_SIZE * globeRadius) / EARTH_RADIUS_KM / 2,
			0
		);
		const satMaterial = new THREE.MeshLambertMaterial({
			color: 'palegreen',
			transparent: true,
			opacity: fromOpacity,
		});
		return new THREE.Mesh(satGeometry, satMaterial);
	}, [globeRadius, fromOpacity]);

	return (
		<AbsoluteFill
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			<Globe
				ref={globeEl}
				showGlobe
				rendererConfig={{
					alpha: false,
					antialias: false,
				}}
				globeImageUrl="https://unpkg.com/three-globe@2.18.0/example/img/earth-blue-marble.jpg"
				bumpImageUrl="https://unpkg.com/three-globe@2.18.0/example/img/earth-topology.png"
				backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
				animateIn={false}
				objectsData={objectsData}
				objectLat="lat"
				objectLng="lng"
				objectAltitude="alt"
				objectThreeObject={satObject}
				onGlobeReady={() => {
					if (globeEl) {
						continueRender(handle);
					}
				}}
			/>
		</AbsoluteFill>
	);
};
