import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { color } from 'react-native-tailwindcss';

export default function TabBarIcon({ name, focused }) {
  return (
    <Ionicons name={name} size={26} style={{ marginBottom: -3 }} color={focused ? color.blue500 : color.gray400} />
  );
}
