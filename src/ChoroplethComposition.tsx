import {useMemo} from 'react';
import {useRef} from 'react';
import {cancelRender, interpolate, spring, staticFile} from 'remotion';
import {useVideoConfig} from 'remotion';
import {useCurrentFrame} from 'remotion';
import {continueRender} from 'remotion';
import {useEffect} from 'react';
import {delayRender} from 'remotion';
import {useState} from 'react';
import {AbsoluteFill} from 'remotion';
import Globe, {GlobeMethods} from 'react-globe.gl';
import * as d3 from 'd3';

const colorScale = d3.scaleSequentialSqrt(d3.interpolateYlOrRd);

export const ChoroplethComposition = () => {
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

	// GDP per capita (avoiding countries with small pop)
	const getVal = (feat) =>
		feat.properties.GDP_MD_EST / Math.max(1e5, feat.properties.POP_EST);

	const maxVal = useMemo(
		() => Math.max(...countries.features.map(getVal)),
		[countries]
	);
	colorScale.domain([0, maxVal]);

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
				globeImageUrl={staticFile('earth-night.jpg')}
				backgroundImageUrl={staticFile('night-sky.png')}
				lineHoverPrecision={0}
				polygonsData={countries.features.filter(
					(d) => d.properties.ISO_A2 !== 'AQ'
				)}
				polygonAltitude={(d) => 0.01}
				polygonCapColor={(d) => colorScale(getVal(d))}
				polygonSideColor={() => 'rgba(0, 100, 0, 0.15)'}
				polygonStrokeColor={() => '#111'}
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
