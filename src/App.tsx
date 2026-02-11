import { useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { SetupScreen } from './components/screens/SetupScreen';
import { GameScreen } from './components/screens/GameScreen';
import { CalibrationScreen } from './components/screens/CalibrationScreen';
import { ResultScreen } from './components/screens/ResultScreen';
import type { VisionPipeline } from './services/vision/VisionPipeline';

export function App() {
  const gamePhase = useGameStore((s) => s.gamePhase);
  const setPhase = useGameStore((s) => s.setPhase);
  const pipelineRef = useRef<VisionPipeline | null>(null);

  const handleCalibrated = (pipeline: VisionPipeline) => {
    pipelineRef.current = pipeline;
    setPhase('playing');
  };

  const handleSkipCalibration = () => {
    setPhase('playing');
  };

  switch (gamePhase) {
    case 'setup':
      return <SetupScreen />;
    case 'calibration':
      return (
        <CalibrationScreen
          onCalibrated={handleCalibrated}
          onSkip={handleSkipCalibration}
        />
      );
    case 'playing':
      return <GameScreen pipeline={pipelineRef.current} />;
    case 'finished':
      return <ResultScreen />;
    default:
      return <SetupScreen />;
  }
}
