import LoginSingup from "./components/LoginSignup/LoginSingup";
import Cube from "./components/Cube/Cube";

export default function Home() {
  return (
    <div>
      <Cube />
      <div style={{ 
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        color: 'white'
      }}>
        <LoginSingup />
      </div>
    </div>
  );
}
