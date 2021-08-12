import React from 'react';
import { Text } from 'react-native';
import { tw } from 'react-native-tailwindcss';

const BodyText = ({
  children,
  hairline,
  thin,
  light,
  medium,
  semibold,
  bold,
  heavy,
  italic,
  xs,
  sm,
  lg,
  xl,
  xl2,
  xl3,
  xl4,
  xl5,
  xl6,
  center,
  right,
  style = [],
}) => {
  let fontFamilyKey = 'fontLato';

  if (hairline) fontFamilyKey = 'fontLatoHairline';
  if (thin) fontFamilyKey = 'fontLatoThin';
  if (light) fontFamilyKey = 'fontLatoLight';
  if (medium) fontFamilyKey = 'fontLatoMedium';
  if (semibold) fontFamilyKey = 'fontLatoSemibold';
  if (bold) fontFamilyKey = 'fontLatoBold';
  if (heavy) fontFamilyKey = 'fontLatoHeavy';
  if (italic) fontFamilyKey += 'Italic';

  let fontSizeKey = 'textBase';

  if (xs) fontSizeKey = 'textXs';
  if (sm) fontSizeKey = 'textSm';
  if (lg) fontSizeKey = 'textLg';
  if (xl) fontSizeKey = 'textXl';
  if (xl2) fontSizeKey = 'text2xl';
  if (xl3) fontSizeKey = 'text3xl';
  if (xl3) fontSizeKey = 'text3xl';
  if (xl4) fontSizeKey = 'text4xl';
  if (xl5) fontSizeKey = 'text5xl';
  if (xl6) fontSizeKey = 'text6xl';

  let alignKey = 'textLeft';

  if (center) alignKey = 'textCenter';
  if (right) alignKey = 'textRight';

  return <Text style={[tw[fontSizeKey], tw[alignKey], tw[fontFamilyKey], tw.textGray700, ...style]}>{children}</Text>;
};

const HeaderText = ({
  children,
  hairline,
  thin,
  light,
  semibold,
  bold,
  heavy,
  italic,
  xs,
  sm,
  lg,
  xl,
  xl2,
  xl3,
  xl4,
  xl5,
  xl6,
  center,
  right,
  style = [],
}) => {
  let fontFamilyKey = 'fontJosefinSansLight';

  if (hairline) fontFamilyKey = 'fontJosefinSansThin';
  if (thin) fontFamilyKey = 'fontJosefinSansThin';
  if (light) fontFamilyKey = 'fontJosefinSansLight';
  if (semibold) fontFamilyKey = 'fontJosefinSansSemibold';
  if (bold) fontFamilyKey = 'fontJosefinSansBold';
  if (heavy) fontFamilyKey = 'fontJosefinSansBold';
  if (italic) fontFamilyKey += 'Italic';

  let fontSizeKey = 'text2xl';

  if (xs) fontSizeKey = 'textXs';
  if (sm) fontSizeKey = 'textSm';
  if (lg) fontSizeKey = 'textLg';
  if (xl) fontSizeKey = 'textXl';
  if (xl2) fontSizeKey = 'text2xl';
  if (xl3) fontSizeKey = 'text3xl';
  if (xl3) fontSizeKey = 'text3xl';
  if (xl4) fontSizeKey = 'text4xl';
  if (xl5) fontSizeKey = 'text5xl';
  if (xl6) fontSizeKey = 'text6xl';

  let alignKey = 'textLeft';

  if (center) alignKey = 'textCenter';
  if (right) alignKey = 'textRight';

  return <Text style={[tw[fontSizeKey], tw[alignKey], tw[fontFamilyKey], tw.textGray700, ...style]}>{children}</Text>;
};

export { BodyText, HeaderText };
