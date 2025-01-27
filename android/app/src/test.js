
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import Svg, { Polyline } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/FontAwesome';

const App = () => {
  const [messages, setMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [inputText, setInputText] = useState('');
  const [recordTime, setRecordTime] = useState('00:00');
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackTime, setPlaybackTime] = useState('00:00');
  const [waveformData, setWaveformData] = useState([]);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const startRecording = async () => {
    try {
      const result = await audioRecorderPlayer.startRecorder();
      setRecording(true);
      setRecordTime('00:00');
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));
      });
      console.log('Recording started:', result);
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      setRecordTime('00:00');
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: `msg_${Date.now()}`, type: 'audio', content: result },
      ]);
      console.log('Recording stopped. File saved at:', result);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const deleteRecording = () => {
    setRecording(false);
    setRecordTime('00:00');
  };

  const playAudio = async (messageId, path) => {
    if (playingMessageId === messageId) {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlayingMessageId(null);
      setPlaybackTime('00:00');
      setWaveformData([]); // Clear waveform data
      return;
    }

    try {
      setPlayingMessageId(messageId);
      await audioRecorderPlayer.startPlayer(path);
      audioRecorderPlayer.addPlayBackListener((e) => {
        setPlaybackTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)));

        // Generate mock waveform data
        const amplitude = Math.random() * 50 + 50; // Randomized amplitude for demo
        setWaveformData((prev) => [...prev.slice(-100), amplitude]);

        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          setPlayingMessageId(null);
          setPlaybackTime('00:00');
          setWaveformData([]);
        }
      });
    } catch (error) {
      console.error('Error playing audio:', error);
      Alert.alert('Error', 'Failed to play audio.');
    }
  };

  const sendMessage = () => {
    if (inputText.trim()) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { id: `msg_${Date.now()}`, type: 'text', content: inputText },
      ]);
      setInputText('');
    }
  };

  const renderWaveform = () => {
    const points = waveformData
      .map((value, index) => `${index},${100 - value}`)
      .join(' '); // Generate SVG points
    return (
      <Svg height="50" width="200">
        <Polyline points={points} fill="none" stroke="blue" strokeWidth="2" />
      </Svg>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.type === 'text') {
      return (
        <View
          style={[
            styles.messageBubble,
            item.isIncoming ? styles.incomingBubble : styles.outgoingBubble,
          ]}
        >
          <Text style={styles.messageText}>{item.content}</Text>
        </View>
      );
    }

    if (item.type === 'audio') {
      return (
        <View
          style={[
            styles.messageBubble,
            item.isIncoming ? styles.incomingBubble : styles.outgoingBubble,
          ]}
        >
          <TouchableOpacity onPress={() => playAudio(item.id, item.content)}>
            <Ionicons
              name={playingMessageId === item.id ? 'pause' : 'play'}
              size={20}
              color="#000"
            />
          </TouchableOpacity>
          {playingMessageId === item.id && renderWaveform()}
          <Text style={styles.audioText}>
            {playingMessageId === item.id ? playbackTime : '00:00'}
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.chatArea}
      />

      <View>
        {!recording ? (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Ask anything..."
              value={inputText}
              onChangeText={setInputText}
            />
            <TouchableOpacity onPress={startRecording} style={styles.micButton}>
              <Icon name={'microphone'} size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
              <AntDesign name="arrowup" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inputArea}>
            <Text>Recording... {recordTime}</Text>
            <TouchableOpacity onPress={stopRecording} style={styles.micButton}>
              <Icon name={'stop'} size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={deleteRecording}
              style={styles.deleteRecordingButton}
            >
              <Ionicons name="trash" size={15} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatArea: {
    flex: 1,
    padding: 10,
  },
  messageBubble: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
  },
  incomingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#e1f7d5',
  },
  outgoingBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#eaecee',
  },
  messageText: {
    color: '#000',
  },
  audioText: {
    color: '#000',
    marginTop: 5,
    fontSize: 12,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    height: 50,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    elevation: 3,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  micButton: {
    borderRadius: 20,
    padding: 5,
  },
  sendButton: {
    backgroundColor: '#16a085',
    borderRadius: 5,
    padding: 5,
    marginLeft: 10,
  },
  deleteRecordingButton: {
    backgroundColor: '#d9534f',
    borderRadius: 20,
    padding: 8,
    height: 30,
  },
});

export default App;
