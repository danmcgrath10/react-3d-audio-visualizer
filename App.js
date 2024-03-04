import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
import AmorphousBlobVisualizer from "./src/AmorphousBlob";

const App = () => {
  const [file, setFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioContextRef = useRef(new AudioContext());
  const audioBufferRef = useRef(null);
  const analyserRef = useRef(audioContextRef.current.createAnalyser());
  const gainNodeRef = useRef(audioContextRef.current.createGain());
  const animationFrameRef = useRef(null);
  const sourceNodeRef = useRef(null);

  useEffect(() => {
    gainNodeRef.current.connect(audioContextRef.current.destination);
    analyserRef.current.connect(gainNodeRef.current);

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  useEffect(() => {
    const updateProgress = () => {
      if (sourceNodeRef.current && isPlaying) {
        const playTime =
          audioContextRef.current.currentTime - sourceNodeRef.current.startTime;
        setCurrentTime(playTime);
        if (playTime >= duration) {
          setIsPlaying(false);
          setCurrentTime(duration);
        } else {
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      }
    };

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && audioContextRef.current) {
      const arrayBuffer = await file.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
      setDuration(audioBufferRef.current.duration);
      setCurrentTime(0);
      setFile(file); // Not used directly, but useful if needing to reset/reload the audio
    }
  };

  const playAudio = () => {
    if (audioBufferRef.current && audioContextRef.current) {
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBufferRef.current;
      sourceNode.connect(analyserRef.current);
      sourceNode.start(0, currentTime);
      sourceNode.startTime = audioContextRef.current.currentTime - currentTime;
      sourceNode.onended = () => setIsPlaying(false);
      sourceNodeRef.current = sourceNode;
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      setIsPlaying(false);
    }
  };

  const handleSeek = (event) => {
    const seekTime = (event.target.value / 100) * duration;
    setCurrentTime(seekTime);
    if (isPlaying) {
      playAudio();
    }
  };

  const formatTime = (time) =>
    `${Math.floor(time / 60)}:${`0${Math.floor(time % 60)}`.slice(-2)}`;

  return (
    <View style={styles.container}>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
      <Button
        title={isPlaying ? "Pause" : "Play"}
        onPress={isPlaying ? pauseAudio : playAudio}
      />
      <input
        type="range"
        style={styles.progress}
        min="0"
        max="100"
        value={(currentTime / duration) * 100 || 0}
        onChange={handleSeek}
      />
      <Text>{`${formatTime(currentTime)} / ${formatTime(duration)}`}</Text>
      {file && <AmorphousBlobVisualizer audioAnalyser={analyserRef.current} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  progress: {
    width: "100%",
    marginTop: 10,
  },
});

export default App;
