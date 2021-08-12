import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    position: 'absolute',
    borderRadius: 0,
    flex: 1,
    overflow: 'hidden',
  },
  description: {
    marginVertical: 2,
    marginLeft: 2,
    marginRight: 5,
    color: '#fff',
    fontSize: 12,
    lineHeight: 13,
    alignSelf: 'flex-start',
    flex: 1,
    fontWeight: 'bold',
  },
});

export default styles;
