import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { tw } from 'react-native-tailwindcss';
import { BodyText } from '../../../components';

const Carousel = ({ items }) => {
  const [interval, setInterval] = useState(1);
  const [width, setWidth] = useState(0);

  const init = initWidth => {
    setWidth(initWidth);
  };

  const getInterval = offset => {
    for (let i = 1; i <= items.length; i++) {
      if (offset < (width / items.length) * i) {
        return i;
      }
      if (i === items.length) {
        return i;
      }
    }
  };

  const bullets = Array(items.length)
    .fill()
    .map((_, i) => {
      const opacity = interval === i + 1 ? 0.65 : 0.2;

      return (
        <BodyText lg key={i} style={[tw.pL2, { opacity }]}>
          &bull;
        </BodyText>
      );
    });

  return (
    <View style={[tw.wFull, tw.borderB, tw.borderGray300]}>
      <ScrollView
        horizontal
        contentContainerStyle={[
          tw.flexRow,
          tw.overflowHidden,
          {
            width: `${100 * items.length}%`,
          },
        ]}
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={w => init(w)}
        onScroll={data => {
          setWidth(data.nativeEvent.contentSize.width);
          setInterval(getInterval(data.nativeEvent.contentOffset.x));
        }}
        scrollEventThrottle={200}
        pagingEnabled
        decelerationRate="fast"
      >
        {items.map((item, idx) => (
          <View key={`item-${idx}`} style={[tw.pB10, tw.pT4, tw.flex1, tw.flexRow, tw.flexWrap, tw.justifyCenter]}>
            {item}
          </View>
        ))}
      </ScrollView>
      <View style={[tw.absolute, tw.bottom0, tw.flexRow, tw.pX4, tw.pT4, tw.pB2, tw.selfCenter]}>{bullets}</View>
    </View>
  );
};

export default Carousel;
