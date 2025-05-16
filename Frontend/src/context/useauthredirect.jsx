import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authcontext';

const useAuthRedirect = () => {
  const { authData } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authData) {
      navigate('/dashboard', { replace: true }); // Replace history entry
    }
  }, [authData, navigate]);
};

export default useAuthRedirect;
