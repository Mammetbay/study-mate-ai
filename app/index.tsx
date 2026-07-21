import { Text, View } from "react-native";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text
        style={{
          fontSize: 48,
          color: '#ddab15e9',
          fontWeight: '600'
        }}
      >Hello World!</Text>
    </View>
  );
}
