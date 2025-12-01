
import { Product, Ticket } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p3',
    asin: 'B0B4B2HW2N',
    modelNumber: 'CT300', 
    name: 'Gtheos Wireless Gaming Headset 2.4GHz',
    category: 'Electronics',
    marketplace: 'US',
    image: '', 
    features: [
      'Lossless 2.4GHz Wireless',
      'Up to 40H Battery Life (RGB Off)',
      '3-in-1 Connection',
      'Omnidirectional Mic'
    ],
    manual_content: `
      Page 2: Battery Life.
      Standard mode (RGB Lights ON): Approx 15-20 hours.
      Eco Mode (RGB Lights OFF): Up to 40 hours.
      To turn off RGB: Double press the power button quickly.
      
      Page 4: Connection.
      If audio cuts out, please check if the USB dongle is plugged into a USB 3.0 port which might cause interference. Use the extension cable.
    `,
    troubleshooting: `
      Issue: Battery drains too fast.
      Analysis: High volume and RGB lights consume 50% more power.
      Solution: Advise customer to turn off RGB lights for marathon gaming sessions.
      
      Issue: Mic not working.
      Step 1: Check mute switch on earcup.
      Step 2: Check Windows Privacy settings.
    `,
    policy: '30-Day Free Returns. 2-Year Warranty for quality issues.',
    expert_knowledge: [
      {
        id: 'qa1',
        question: "Does this work with PS5 wirelessly?",
        answer: "Yes, plug the USB dongle directly into the PS5 USB-A port. It recognizes it instantly as a USB headset. Do not use the 3.5mm cable if you want wireless.",
        keywords: ['ps5', 'playstation', 'console'],
        author: 'Engineer',
        updatedAt: '2023-11-01'
      },
      {
        id: 'qa2',
        question: "There is a static noise / buzzing sound.",
        answer: "Static is usually caused by 2.4GHz interference from Wi-Fi routers. Please move the USB dongle away from the back of the PC case using a USB extension cable.",
        keywords: ['static', 'buzzing', 'noise', 'interference'],
        author: 'Engineer',
        updatedAt: '2023-11-05'
      }
    ]
  },
  {
    id: 'p4',
    asin: 'B0FD3KWHT2',
    modelNumber: 'CT-PAD-JP',
    name: 'G-Pad Pro 11インチ タブレット Android 13 (2024モデル) Wi-Fiモデル',
    category: 'Electronics',
    marketplace: 'JP',
    image: 'https://m.media-amazon.com/images/I/710VjIDe7bD._AC_SL1500_.jpg',
    features: [
      '11インチ 2K IPSディスプレイ (2000x1200)',
      '大容量 8000mAh バッテリー',
      '最新 Android 13 OS 搭載',
      '専用スタイラスペン付属',
      '8GB RAM + 128GB ROM'
    ],
    manual_content: `
      充電について: 付属のUSB-Cケーブルとアダプターを使用してください。
      画面のちらつき: 自動輝度調整がオンになっている可能性があります。設定 > ディスプレイ > 自動調整 をオフにしてください。
      スタイラスペンの接続: ペンをタブレットの側面に磁気吸着させると自動的にペアリングされます。
    `,
    troubleshooting: `
      問題: 電源が入らない
      解決策: 電源ボタンを15秒間長押しして強制再起動を試してください。
      
      問題: Wi-Fiが切れる
      解決策: 機内モードをオンにしてからオフにし、ネットワーク設定をリセットしてください。
    `,
    policy: 'Amazon.co.jp 返品ポリシー: 30日以内の返品・交換が可能。開封済みの場合、50%の返金となる場合があります。'
  },
  {
    id: 'p1',
    asin: 'B08XYZ1234',
    modelNumber: 'LUM-1000-OD',
    name: 'LuminaPro Outdoor Camping Lantern 1000LM',
    category: 'Outdoor',
    marketplace: 'US',
    image: 'https://m.media-amazon.com/images/I/71r+t8b-N-L._AC_SL1500_.jpg',
    features: [
      '1000 Lumens brightness',
      'Rechargeable 5000mAh battery',
      'IPX4 Waterproof',
      '4 Light Modes: Warm, Cool, Combined, Flashing'
    ],
    manual_content: `
      Page 3: Charging Instructions. 
      The power indicator flashes RED when charging and turns SOLID GREEN when fully charged. 
      If the red light blinks rapidly (3 times per second), it indicates a battery error or incompatible cable.
      
      Page 5: Operation.
      Press the button once to turn on. Press again to cycle modes. Long press (3s) to activate SOS mode.
    `,
    troubleshooting: `
      Issue: Light won't turn on.
      Step 1: Check if the transportation lock is active. Hold the button for 10 seconds to unlock.
      Step 2: Ensure battery is charged.
      
      Issue: Red light blinking continuously.
      Step 1: Change the USB cable. 
      Step 2: Let it cool down if overheated.
    `,
    policy: '30-Day No-Questions-Asked Return Policy. 1 Year Warranty on battery defects.'
  },
  {
    id: 'p2',
    asin: 'B09ABC5678',
    modelNumber: 'SS-TW-53-BLK',
    name: 'SonicStream True Wireless Earbuds',
    category: 'Electronics',
    marketplace: 'DE',
    image: 'https://m.media-amazon.com/images/I/61s+N9hyLpL._AC_SL1500_.jpg',
    features: [
      'Active Noise Cancellation',
      '30h Playtime',
      'IPX7 Waterproof',
      'Bluetooth 5.3'
    ],
    manual_content: `
      Pairing: Open the case. The earbuds will enter pairing mode automatically (Blue/White flashing).
      Reset: Place earbuds in case, keep lid open, press and hold back button for 10 seconds until Red LED flashes 3 times.
    `,
    troubleshooting: `
      Issue: Left earbud not working.
      Step 1: Clean charging contacts with alcohol.
      Step 2: Perform Factory Reset.
      
      Issue: Poor sound quality.
      Step 1: Check ear tip fit.
    `,
    policy: 'Electronics return window: 30 days. Hygiene seal must be unbroken for full refund unless defective.'
  }
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't3',
    customerName: 'Jason K.',
    emailBody: "I bought the Gtheos headset mainly for the battery life, but it only lasts about 15 hours, not the 40 hours advertised! I have to charge it every single day. Is my unit defective? I'm thinking of returning it.",
    timestamp: '2023-10-26T14:00:00Z',
    status: 'pending'
  },
  {
    id: 't4',
    customerName: 'Kenji Sato',
    emailBody: "タブレット（B0FD3KWHT2）を購入しましたが、画面が時々点滅します。初期不良でしょうか？交換をお願いしたいです。",
    timestamp: '2023-10-27T10:00:00Z',
    status: 'pending'
  },
  {
    id: 't1',
    customerName: 'Sarah Jenkins',
    emailBody: "Hi, I bought the camping lantern last week. It was working fine, but now when I plug it in, the red light just keeps blinking really fast and it won't charge. We have a trip this weekend, please help!",
    timestamp: '2023-10-25T09:00:00Z',
    status: 'pending'
  },
  {
    id: 't2',
    customerName: 'Michael Chen',
    emailBody: "The left earbud isn't connecting anymore. I tried putting it back in the case but nothing happens.",
    timestamp: '2023-10-25T10:30:00Z',
    status: 'pending'
  }
];
