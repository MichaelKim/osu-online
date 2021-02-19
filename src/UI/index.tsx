import React from 'react';
import { BeatmapData, parseBeatmap } from '../Game/Loader/BeatmapLoader';

const BEATMAPS = [
  'beatmaps/336099 LeaF - Wizdomiot/LeaF - Wizdomiot (Asahina Momoko) [Hard].osu',
  'beatmaps/336099 LeaF - Wizdomiot/LeaF - Wizdomiot (Asahina Momoko) [Hyper].osu',
  'beatmaps/336099 LeaF - Wizdomiot/LeaF - Wizdomiot (Asahina Momoko) [Lunatic].osu',
  'beatmaps/336099 LeaF - Wizdomiot/LeaF - Wizdomiot (Asahina Momoko) [Another].osu',
  'beatmaps/1183900 Powerless feat Sennzai - Lost Desire/Powerless feat. Sennzai - Lost Desire (meiikyuu) [Easy].osu',
  'beatmaps/1183900 Powerless feat Sennzai - Lost Desire/Powerless feat. Sennzai - Lost Desire (meiikyuu) [Insane].osu'
];

type BeatmapItemProps = {
  filepath: string;
};

// function BeatmapItem({ filepath }: BeatmapItemProps) {
//   const [data, setData] = React.useState<BeatmapData | null>(null);

//   React.useEffect(() => {
//     parseBeatmap(filepath).then(data => {
//       setData(data);
//     });
//   }, [filepath]);

//   if (data == null) {
//     return (
//       <div>
//         <p>Loading...</p>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <p>Name: {data.title}</p>
//     </div>
//   );
// }

// function BeatmapSelect() {
//   return (
//     <div>
//       {BEATMAPS.map(filepath => (
//         <BeatmapItem key={filepath} filepath={filepath} />
//       ))}
//     </div>
//   );
// }

type BeatmapInfoProps = {
  files: File[];
};

function BeatmapInfo({ files }: BeatmapInfoProps) {
  const [diffs, setDiffs] = React.useState<BeatmapData[]>([]);

  React.useEffect(() => {
    const osuFiles = files.filter(f => f.name.endsWith('.osu'));
    Promise.all(
      osuFiles.map(f =>
        f.text().then(text => text.split('\n').map(l => l.trim()))
      )
    ).then(beatmaps => setDiffs(beatmaps.map(b => parseBeatmap(b))));
  }, [files]);

  return (
    <div>
      {diffs.map(d => (
        <div key={d.beatmapID}>
          <p>
            {d.title} - {d.version}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Root() {
  const [files, setFiles] = React.useState<File[]>([]);

  const onClick = async () => {
    // @ts-expect-error: new File System Access API
    const handle = await window.showDirectoryPicker();
    for await (const entry of handle.values()) {
      console.log(entry);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
    if (files == null) {
      return;
    }
    setFiles(Array.from(files));
  };

  return (
    <div>
      <h1>osu!</h1>
      <input
        type='file'
        // @ts-expect-error: non-standard API
        webkitdirectory='true'
        onChange={onChange}
      />
      <button onClick={onClick}>Select osu folder</button>
      {/* <BeatmapSelect /> */}
      <BeatmapInfo files={files} />
    </div>
  );
}
