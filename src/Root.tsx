import {Composition} from 'remotion';
import {GlobeGlComposition} from './GlobeGlComposition';
import {HexPolygonComposition} from './HexPolygonComposition';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			<Composition
				id="GlobeGL"
				component={GlobeGlComposition}
				durationInFrames={360}
				fps={30}
				width={1280}
				height={720}
				defaultProps={{}}
			/>
			<Composition
				id="HexagonGL"
				component={HexPolygonComposition}
				durationInFrames={360}
				fps={30}
				width={1280}
				height={720}
				defaultProps={{}}
			/>
		</>
	);
};
