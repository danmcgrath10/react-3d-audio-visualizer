// Import necessary hooks and components from React and React Native
import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
// Import the visualizer component for the amorphous blob
import AmorphousBlobVisualizer from "./src/AmorphousBlob";

const App = () => {
  // State hooks to manage file, playback state, current time, and duration
  const [file, setFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Refs for managing audio context, buffer, analyser, gain node, animation frame, and source node
  const audioContextRef = useRef(new AudioContext());
  const audioBufferRef = useRef(null);
  const analyserRef = useRef(audioContextRef.current.createAnalyser());
  const gainNodeRef = useRef(audioContextRef.current.createGain());
  const animationFrameRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Effect hook to setup audio routing and cleanup on component unmount
  useEffect(() => {
    gainNodeRef.current.connect(audioContextRef.current.destination);
    analyserRef.current.connect(gainNodeRef.current);

    // Cleanup to cancel any animation frame request on component unmount
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, []);

  // Effect hook to manage playback progress and auto-stop
  useEffect(() => {
    const updateProgress = () => {
      if (sourceNodeRef.current && isPlaying) {
        // Calculate play time based on audio context's current time
        const playTime =
          audioContextRef.current.currentTime - sourceNodeRef.current.startTime;
        setCurrentTime(playTime);
        if (playTime >= duration) {
          // Stop playback when duration is reached
          setIsPlaying(false);
          setCurrentTime(duration);
        } else {
          // Request the next animation frame to update progress
          animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
      }
    };

    // Start updating progress if playback is active
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }

    // Cleanup to cancel the animation frame request
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, duration]);

  // Handles audio file selection
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file && audioContextRef.current) {
      // Decode the selected audio file
      const arrayBuffer = await file.arrayBuffer();
      audioBufferRef.current = await audioContextRef.current.decodeAudioData(
        arrayBuffer
      );
      // Set the audio duration and reset current time
      setDuration(audioBufferRef.current.duration);
      setCurrentTime(0);
      // Store the file in state (not used directly but useful for UI/UX purposes)
      setFile(file);
    }
  };

  // Starts or resumes audio playback
  const playAudio = () => {
    if (audioBufferRef.current && audioContextRef.current) {
      // Disconnect existing source node to avoid multiple connections
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBufferRef.current;
      sourceNode.connect(analyserRef.current);
      // Start playback from the current time
      sourceNode.start(0, currentTime);
      // Store the start time to calculate progress
      sourceNode.startTime = audioContextRef.current.currentTime - currentTime;
      // Handle playback end to update UI state
      sourceNode.onended = () => setIsPlaying(false);
      sourceNodeRef.current = sourceNode;
      setIsPlaying(true);
    }
  };

  // Pauses audio playback
  const pauseAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      setIsPlaying(false);
    }
  };

  // Handles seeking in the audio playback
  const handleSeek = (event) => {
    const seekTime = (event.target.value / 100) * duration;
    setCurrentTime(seekTime);
    // Resume playback from the new time if already playing
    if (isPlaying) {
      playAudio();
    }
  };

  // Formats time in minutes:seconds format
  const formatTime = (time) =>
    `${Math.floor(time / 60)}:${`0${Math.floor(time % 60)}`.slice(-2)}`;

  // Render the UI
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

// Styles for the React Native components
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
