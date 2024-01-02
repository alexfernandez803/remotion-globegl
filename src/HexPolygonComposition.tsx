import {useRef} from 'react';
import {cancelRender, interpolate, spring, staticFile, random} from 'remotion';
import {useVideoConfig} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {continueRender} from 'remotion';
import {useEffect} from 'react';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {AbsoluteFill} from 'remotion';
import Globe, {GlobeMethods} from 'react-globe.gl';
import * as turf from '@turf/turf';

const hexPolygonColor = (data: turf.Feature) => {
	const center = turf.center(data);
	const centerCoords =
		center.geometry.coordinates[0] + center.geometry.coordinates[1];
	return `#${Math.round(random(centerCoords) * 2 ** 24)
		.toString(16)
		.padStart(6, '0')}`;
};

export const HexPolygonComposition = () => {
	const [globeHandle] = useState(() => delayRender());
	const [featureHandle] = useState(() => delayRender());
	const globeEl = useRef<GlobeMethods | undefined>(undefined);
	const [countries, setCountries] = useState({features: []});

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

	useEffect(() => {
		if (globeEl.current) {
			const currentGlobe = globeEl.current as GlobeMethods;
			currentGlobe.pointOfView({
				lat: 0,
				lng: longRotate,
				altitude: zoom,
			});
		}
	}, [globeEl, longRotate, zoom]);

	useEffect(() => {
		// Load data
		fetch(staticFile('ne_110m_admin_0_countries.geojson'))
			.then((res) => {
				continueRender(featureHandle);
				return res.json();
			})
			.then(setCountries)
			.catch((err) => {
				cancelRender(err);
			});
	}, []);

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
				hexPolygonUseDots
				rendererConfig={{
					alpha: false,
					antialias: false,
				}}
				globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
				hexPolygonsData={countries.features}
				hexPolygonResolution={3}
				hexPolygonMargin={0.3}
				hexPolygonColor={(data) => {
					return hexPolygonColor(data as turf.Feature);
				}}
				animateIn={false}
				onGlobeReady={() => {
					if (globeEl) {
						continueRender(globeHandle);
					}
				}}
			/>
		</AbsoluteFill>
	);
};
