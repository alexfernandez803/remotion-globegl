import {Composition} from 'remotion';
import {GlobeGlComposition} from './GlobeGlComposition';

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
		</>
	);
};
