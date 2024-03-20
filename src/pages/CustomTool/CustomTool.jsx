import { useState, useEffect } from "react";
import { useAuth, useWss } from 'blustai-react-core';
import { useNavigate } from 'blustai-react-router';
import toast from 'react-hot-toast';
import Generator from "../../components/Generator";
import { Button, Typography, Box, Container,  } from "@mui/material";
import { FeaturedImages } from "../../components/FeaturedImages";


const featured=true;
const service_name=import.meta.env.VITE_TOOL_ID


const CustomTool = ({action}) => {
  const { isInitialized } = useAuth();
  const navigate = useNavigate();
  const { client } = useWss();
  const [service, setService] = useState({});
  const [loading, setLoading] = useState(true);

  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(localStorage.getItem("prompts_last_model_id"));

  const genOpen = (action === 'generate');

  const init = async () => {
    setLoading(true);
    await client.init({
      onReady: async () => {
        try {
          let __service = await client.getService(service_name, featured);
          if (__service?._id) {
            setService(__service);
          }  else {
            toast.error("AI tool not found", { duration: Infinity });
            //navigate(window.location.protocol + "//" + domain);
          }
        } catch (err) {
          toast.error(err.error || err.message || "Server error", { duration: 0 });
          setLoading(false);
        }
        setLoading(false);
      },
      onError: (error) => {
        console.log("error", error?.error);
        toast.error(error?.error || "Error");
      }
    });

  }

  useEffect(() => {
    if (isInitialized) init()
  }, [isInitialized])


  const showImageGenerator = () => {
    navigate(featured?'/generate':'/tools/'+(service.name || service._id)+'/generate');
  }

  const getImageModelName = (model) => {
    if (!model) return;
    let id = (typeof model === 'string') ? model : model._id;
    //images objects contains id of model only, so we have to find the name
    let _model = [service.model, ...service.other_models].find(m => m._id === id);
    return _model?.title || id;

  }


  return <>
    {genOpen ?
      service?._id &&
      <Generator
        service={service}
        featured={featured}
        getImageModelName={getImageModelName}
        initialPrompt={prompt}
        initialModel={model}
      />
      :
      <Box>
        <Box>
          <Container maxWidth="sm" style={{ textAlign: 'center', marginTop: '50px' }}>
            <Typography variant="h3" component="h1" gutterBottom>
              Create Beautiful AI Images Easier Than Ever!
            </Typography>

            <Box my={4}>
              <Button variant="contained" color="primary" size="large" onClick={showImageGenerator}>
                Generate New Image
              </Button>
            </Box>

            <Typography variant="subtitle1" color="textSecondary">
              Or explore images created by others:
            </Typography>
          </Container>
        </Box>
        <Box>
          <FeaturedImages getImageModelName={getImageModelName} />
        </Box>
      </Box>
    }
  </>
}
export default CustomTool;