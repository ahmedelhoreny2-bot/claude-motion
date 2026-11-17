import {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/lalezar/400.css';
import '@fontsource/baloo-bhaijaan-2/700.css';
import '@fontsource/baloo-bhaijaan-2/800.css';

export const useArabicFonts = () => {
  const [handle] = useState(() => delayRender('arabic fonts'));
  useEffect(() => {
    Promise.all([
      document.fonts.load('400 100px "Lalezar"', 'أبج 0123'),
      document.fonts.load('700 40px "Baloo Bhaijaan 2"', 'أبج 0123'),
      document.fonts.load('800 40px "Baloo Bhaijaan 2"', 'أبج 0123'),
    ]).then(() => continueRender(handle));
  }, [handle]);
};
