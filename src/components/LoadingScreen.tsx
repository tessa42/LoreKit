import LoreKitten from '../assets/LoreKitten.png';

interface Props {
  message: string;
}

export default function LoadingScreen({ message }: Props) {
  return (
    <div className="loading-screen animate-fade-in">
      <img
        src={LoreKitten}
        alt="LoreKit is working…"
        className="loading-screen__kitten"
      />
      <p className="loading-screen__message">{message}</p>
    </div>
  );
}
