/**
 * The letters. Every one is Lukas's own words.
 *
 * To add a new letter, add another entry at the end of LETTERS.
 * It automatically becomes the next one she unlocks (one every 5 levels).
 * Leave a blank line between paragraphs.
 */

export interface Letter {
  id: number;
  title: string;
  body: string;
}

/** A letter unlocks each time she finishes this many levels. */
export const LEVELS_PER_LETTER = 5;

export const SIGNATURE = 'Lukas';

const raw: { title: string; body: string }[] = [
  {
    title: 'Peace',
    body: `From the first bench we sat on together, I instantly knew there was something special. You do have especially mesmerizing eyes; however, there is one attribute no other girl I've met ever had: peace.

Whenever we meet, I feel this special feeling inside of me that could not be described in any other way than inner peace. From the moment our eyes meet, my heart instantly slows down, and only one thing matters—one thing and one thing only, you.

Even if I had all of the time this world has to offer, it would not be enough for me to put into words how much I like you.`,
  },
  {
    title: 'Walks',
    body: `Many would say that going for a walk is the simplest, most mundane thing one can do on a date.

I am sure they have never been on a walk with you—where a light breeze catches your hair and the sunlight transforms your eyes into a vast ocean at sunset.

In those moments, the walk itself becomes irrelevant, as does the weather and everything else around us.`,
  },
  {
    title: 'Eyes',
    body: `For so long I wanted to write a poem about your eyes, because I can never get enough of them.

Your eyes are indisputably beautiful in every way, but only those who look closely and pay attention can truly see the magic they possess. The outer rim of your eyes is dark blue, just like the vast ocean where life is created and sunsets are seen from. The closer you get to the center, the lighter the shade of blue gets; it's almost as if the whole ocean is living inside of your eyes.

Even if I looked a whole eternity into your eyes, it would not be close to the time it would take me to get enough.`,
  },
  {
    title: 'Just special',
    body: `You are the kind of person who is not forgotten. I would never forget the way you smile, the way you look at me, or the way you act all angry when I mess with your hair. But I'm sure you know this.

What you don't know is just how special you are to me. There hasn't been one single person with whom I've had so much in common, and not a single person whom I've liked as much as I like you.

Week by week and day by day, this feeling is only growing stronger—this feeling which won't let me think of any other person than you when I listen to music or when I sit down on a bench.

I wanted you to know this because I feel that if I didn't tell you this, my heart would disintegrate.`,
  },
  {
    title: 'At first sight',
    body: `I had never been a believer in the divine, nor did I ever care for the supernatural, until the exact moment our eyes met.

In that instant, my skepticism vanished, and I finally understood what it means to believe in love at first sight. I looked into your eyes and saw two vast oceans looking back at me. They are the same oceans I can never seem to get enough of, and the ones my mind instantly drifts to whenever melancholy sets in.

I fell deeply in love with you then, and I fall in love every day with the way you look at me, the way you smile, and the warmth and peace you carry with you.

People throw the phrase "love at first sight" around so casually these days, but what I feel for you exists on an entirely different plane. For me, it means a heart that refuses to stop thinking about you. It means a rare, sacred sense of peace that no one else on this earth could ever replicate.

You are entirely unique, and that uniqueness is the very reason I love you so much.`,
  },
  {
    title: 'Time stops',
    body: `They say time always moves forward, but every single time our eyes meet, mine completely stops. The world outside just fades into the background, and I'm left with that same deep, undeniable sense of inner peace that only you can give me.

You aren't just someone I think about when the day slows down; you have become the subtle background of everything I do. You're the hidden thread running through every song I listen to, every quiet moment, and every dream I hold close. I used to think my mind belonged entirely to me, but lately every single path in my head just leads straight back to you and those blue oceans I can never get enough of.

Whenever we're together, whether we're walking nowhere in particular or just sitting on a bench, the rest of the world fades out. Nothing else matters except you.

Loving you isn't something I have to try to do. It's something as natural as breathing, and just as necessary.`,
  },
  {
    title: 'Warmth',
    body: `The mornings are slowly starting to turn a little cooler. You can notice the first touch of autumn in the air when I head out for school—those early hours right as the sun comes up, when the breeze has that light, crisp edge that wasn't there a few weeks ago.

Yet, even as the mornings begin to cool down, my heart and my life only keep getting warmer because of you. It's in your sweet nature, the gentle kindness you carry without even thinking about it, and just how easy and comforting it is to be around you.

The cooler weather doesn't bother me at all, because having you in my life brings a steady, quiet warmth that nothing outside can take away. No matter how the seasons change, simply seeing your smile and looking into those familiar ocean eyes is all the warmth I ever need.`,
  },
  {
    title: 'Six months: Peace, found',
    body: `Six months ago I sat beside you, not knowing I was sitting beside the one piece of myself I never knew was missing.

For as long as I can remember, peace was a word I only used to describe you — the way your eyes still slow my heart, the way a room settles the second you walk into it.

What I didn't know six months ago is that peace was also the shape of a piece I'd been missing without realizing it was gone. You didn't just bring me peace. You were the piece.`,
  },
  {
    title: 'Six months: Still',
    body: `Six months of benches and walks and mornings slowly turning into autumn, and still, every time, my mind stops the moment our eyes meet.

Still the ocean in your eyes hasn't run out of blue for me to get lost in.

Still no season, no cooler morning, can touch the warmth you carry into every version of my day.`,
  },
  {
    title: 'Six months: Whole',
    body: `I always thought I was whole on my own — that a life could be complete without needing anyone else in it.

Six months with you didn't fill some emptiness I never had. What it did was show me something I couldn't have known any other way: just how much that wholeness depends on you being part of it. I was whole before you. I just didn't understand how important you'd become to that wholeness until now.

Happy six months, Emily. My peace, my piece — found in you.`,
  },
  {
    title: 'From the oasis',
    body: `As I sit here, in the desert turned into an oasis, I can still only think of you. Of your touch that seems to touch my very soul, my very heart. The same heart that is aching because it craves someone who is miles and miles out of sight.

You don't even understand how deeply I want you. I want to see you. I want to touch you. I want to pull you closer. I want to see your eyes. I want our eyes to meet, and I want them to dance. I want to wake up next to you. I want to open my eyes and see you as if there was nothing or no one else in this world. For a second, I want to forget and erase anyone or anything that could interfere with me thinking of the one and only person I want beside me: you. Yes, you, Emily.

I'm hopeless, as I sit and lie here. I'm hopelessly in love with you. I romanticize every corner, bench and sunset I see just because of you. I want to give you the world, the moon and the stars. I want to pick every peony on this planet just to bring them to you. If only I could take every inch of pain you feel and inflict it upon myself. I don't think you realise what I would do for you. You mean so much to me.

I dream of a night under the stars. A night where you lie into my arms and I hear your breath, your voice and your laugh.

May every spark remind you of me.`,
  },
];

export const LETTERS: Letter[] = raw.map((l, i) => ({ id: i + 1, ...l }));

/**
 * Once every letter has been unlocked, each 5th level shows one of these
 * short lines on the win screen instead. All taken from the letters above.
 */
export const LINES: string[] = [
  'You were the piece.',
  'Only one thing matters—one thing and one thing only, you.',
  "It's almost as if the whole ocean is living inside of your eyes.",
  'You are the kind of person who is not forgotten.',
  'Every single path in my head just leads straight back to you.',
  'As natural as breathing, and just as necessary.',
  'Still the ocean in your eyes hasn\'t run out of blue for me to get lost in.',
  'I want to pick every peony on this planet just to bring them to you.',
  'May every spark remind you of me.',
];
