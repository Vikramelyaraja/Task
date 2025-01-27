import React, {useState, useRef} from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Icon from 'react-native-vector-icons/FontAwesome';
import Svg, {Polyline} from 'react-native-svg';

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

      // Update recording time
      audioRecorderPlayer.addRecordBackListener(e => {
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );
      });

      console.log('Recording started:', result);
    } catch (error) {
      console.log('Error starting recording:', error);
      //Alert.alert('Error', 'Failed to start recording.');
    }
  };

  // Stop recording and add it as a chat message
  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      setRecording(false);
      setRecordTime('00:00');

      setMessages(prevMessages => [
        ...prevMessages,
        {id: `msg_${Date.now()}`, type: 'audio', content: result},
      ]);

      console.log('Recording stopped. File saved at:', result);
    } catch (error) {
      console.log('Error stopping recording:', error);
      //Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Delete the ongoing or temporary recording
  const deleteRecording = async () => {
    setRecording(false);
    setRecordTime('00:00');
    setTempAudio(null);
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
      audioRecorderPlayer.addPlayBackListener(e => {
        setPlaybackTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)),
        );

        // Generate mock waveform data
        const amplitude = Math.random() * 50 + 50; // Randomized amplitude for demo
        setWaveformData(prev => [...prev.slice(-100), amplitude]);

        if (e.currentPosition >= e.duration) {
          audioRecorderPlayer.stopPlayer();
          setPlayingMessageId(null);
          setPlaybackTime('00:00');
          setWaveformData([]);
        }
      });
    } catch (error) {
      console.log('Error playing audio:', error);
      //Alert.alert('Error', 'Failed to play audio.');
    }
  };

  // Add text message
  const sendMessage = async () => {
    if (inputText.trim()) {
      setMessages(prevMessages => [
        ...prevMessages,
        {id: `msg_${Date.now()}`, type: 'text', content: inputText},
      ]);
      setInputText('');
    }
  };

  const renderWaveform = () => {
    const points = waveformData
      .map((value, index) => `${index},${100 - value}`)
      .join(' '); // Generate SVG points
    return (
      <Svg height="25" width="100">
        <Polyline points={points} fill="none" stroke="green" strokeWidth="3" />
      </Svg>
    );
  };

  // Render each chat message
  const renderMessage = ({item}) => {
    if (item.type === 'text') {
      return (
        <View
          style={[
            styles.messageBubble,
            item.isIncoming ? styles.incomingBubble : styles.outgoingBubble,
          ]}>
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
          ]}>
          <TouchableOpacity onPress={() => playAudio(item.id, item.content)}>
            <View
              style={{
                height: 30,
                width: 30,
                borderRadius: 30,
                marginLeft: 10,
                backgroundColor: 'orange',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons
                name={playingMessageId === item.id ? 'pause' : 'play'}
                size={20}
                color="#000"
              />
            </View>
          </TouchableOpacity>
          <View style={{marginLeft: 10}}>
            {playingMessageId === item.id && renderWaveform()}
          </View>
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
      <View
        style={{
          height: 60,
          width: 500,
          backgroundColor: '#fff',
          justifyContent: 'center',
          flexDirection: 'row',
        }}>
        <View style={{height: 30, width: 100, alignItems: 'flex-start'}}>
          <TouchableOpacity>
            <Image
              source={require('../TravelGPT/Src/Assets/Images/naviicon.png')}
              style={{height: 20, width: 20, marginLeft: 0, marginTop: 20}}
            />
          </TouchableOpacity>
        </View>

        <View style={{height: 60, width: 350, flexDirection: 'row'}}>
          <Image
            source={require('../TravelGPT/Src/Assets/Images/travel2.png')}
            style={{height: 50, width: 50, marginLeft: 0, marginTop: 8}}
          />
          <Text
            style={{
              marginTop: 25,
              marginLeft: 10,
              fontWeight: 'bold',
              color: '#000',
            }}>
            Travel GPT
          </Text>
        </View>
      </View>

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
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
            <View
              style={{
                height: 40,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Image
                source={require('../TravelGPT/Src/Assets/Images/digital.png')}
                style={{height: 40, width: 70, marginLeft: 20, marginTop: 0}}
              />
              <Text>Recording....</Text>
              <Text>{recordTime}</Text>
            </View>
            <TouchableOpacity onPress={stopRecording} style={styles.micButton}>
              <Icon name={'stop'} size={20} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={deleteRecording}
              style={styles.deleteRecordingButton}>
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
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 10,
    marginVertical: 5,
    maxWidth: '80%',
    flexDirection: 'row',
    backgroundColor: '#ffe6e6',
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
    marginLeft: 20,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    height: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginEnd: 10,
    marginLeft: 10,
    marginBottom: 10,
    borderRadius: 20,
    elevation: 30,
  },
  input: {
    flex: 1,
    height: 40,
    // borderWidth: 1,
    // borderColor: '#dee2e6',
    borderRadius: 20,
    //paddingHorizontal: 30,
    marginRight: 10,
  },
  micButton: {
    //backgroundColor: '#28a745',
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
