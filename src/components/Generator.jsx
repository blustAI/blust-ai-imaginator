
import { Grid, Box, Alert, Skeleton, Dialog, Paper, Typography, IconButton, DialogContent, DialogTitle, DialogActions, Button } from "@mui/material";
import { useState, useEffect } from "react";
import { useAuth } from 'blustai-react-core';
import { RouterLink } from 'blustai-react-router';
import { CloseIcon } from "blustai-react-ui";
import { EnchantedForm } from 'blustai-react-datagrid';
import toast from 'react-hot-toast';
import { ImageIcon, InfoOutlinedIcon, DownloadIcon } from 'blustai-react-ui';

const history_load_size = 10;

const Generator = (props) => {
    const { featured, service, getImageModelName, initialPrompt, initialModel } = props;
    const { currentTeam, isAuthenticated } = useAuth();
    const [history, setHistory] = useState([]);
    const [historyEndReached, setHistoryEndReached] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [generating, setGenerating] = useState();
    const [error, setError] = useState();
    const [image, setImage] = useState();
    const [dialogImage, setDialogImage] = useState();

    const [formData, setFormData] = useState({
        model: initialModel || localStorage.getItem("prompts_last_model_id") || service?.model?._id,
        prompt: initialPrompt

    });



    const form_fields = [{
        field: "private_mode",
        headerName: "Private Mode",
        description: "Activate Private Mode to keep your generated images confidential and accessible only to you. When Private Mode is off, your images may be featured in the main feed to inspire others and showcase the capabilities of AI.",
        type: "boolean",
        editable: true,
        grid_options: {
            display: "flex",
            justifyContent: "end"
        },
        input_props: {
            size: "small"
        },
        disabled: (!currentTeam?.plan?.tier || currentTeam?.plan?.tier < 1)
    }, {
        field: "model",
        headerName: "AI Model",
        editable: true,
        fullWidth: true,
        type: "singleSelect",
        valueOptions: [...service && [
            {
                "label": service.model?.title,
                "subtitle": service.model?.subtitle,
                "value": service.model?._id
            },
            ...(service.other_models?.map(m => ({
                "label": m?.title,
                "subtitle": m?.subtitle,
                "value": m?._id
            })) || [])
        ]],
        autoselect: 0
    }, {
        field: "prompt",
        headerName: "Prompt",
        description: "A prompt is a detailed description or idea that guides the AI in creating your image. The clearer and more detailed you are, the better the AI can produce an image that meets your vision.",
        editable: true,
        fullWidth: true,
        type: "textarea",
        required: true,
        rows: 5
    },
    {
        field: "improve_prompt",
        headerName: "Enhance prompt for better result",
        description: "Check this to automatically enhance your prompts, ensuring unique and superior image results.",
        editable: true,
        type: "checkbox",
        placement: "end",
        default: true,
        input_props: {
            size: "small"
        }
    }]


    const generateImage = async (data, actions) => {
        setGenerating(true);
        service.sendMessage(null, {
            message: data.prompt,
            requested_model: data.model,
            params: {
                public_mode: data.private_mode ? false : true,
                categorize: true,
                ...data.improve_prompt && { improve_prompt: true }
            }
        }).then(result => {
            if (result?.images?.length) {
                let generated_image = result.images[0];
                generated_image.thumbnail_url = generated_image.url;//some time required before thumbnail_url will be uploaded
                setImage(generated_image);
                setHistory([{ images: [generated_image] }, ...history]);
                localStorage.setItem("prompts_last_model_id", data.model);
            } else if (typeof result?.body === 'string') {
                toast.error(result.body);
            }
            setGenerating(false);
            actions.setSubmitting(false);
        }).catch(err => {
            console.log("errror occured", err);
            setError("Server connection error");
            setGenerating(false);
            actions.setSubmitting(false);
            throw (err);
        });
    }

    const chooseImage = (_image) => {
        setImage(_image);
    }


    const loadHistory = async () => {
        if (historyEndReached) return;
        if (historyLoading) return;
        setHistoryLoading(true);
        let _history = await service.getHistory(null,{ filters: { role: 'assistant', 'images.0': { '$exists': true } }, limit: history_load_size, skip: (history?.length || 0) });
        if (_history?.length < history_load_size) setHistoryEndReached(true);
        setHistory([...history, ..._history]);
        setHistoryLoading(false);
    }

    const onHistoryScroll = async (event) => {
        if (service && (event.target.scrollLeft + event.target.clientWidth >= (event.target.scrollWidth - 2)))
            loadHistory(service);
    }


    useEffect(() => {
        if (initialPrompt) console.log("need submit form");
    }, [initialPrompt])

    useEffect(() => {
        if (service.premium && !currentTeam?.plan?.premium_access) {
            setError(isAuthenticated ?
                "Upgrade your plan to gain access to premium AI tools."
                :
                "Please log in to unlock premium AI services", { duration: Infinity })
        }
        loadHistory();
    }, [service])



    const ImageDetails = ({ image }) => <>
        <Typography variant="caption">Model</Typography> <br />
        <Typography variant="body2">{getImageModelName(image?.model)}</Typography> <br />
        <Typography variant="caption">Prompt</Typography> <br />
        <Typography variant="body2">{image?.prompt}</Typography> <br />
        {image?.refined_prompt &&
            <>
                <Typography variant="caption">Refined Prompt</Typography> <br />
                <Typography variant="body2">{image.refined_prompt}</Typography> <br />
            </>
        }
    </>

    return <>
        <Grid container sx={{ height: '100%' }}>
            <Grid item xs={12} sm={4} md={4} lg={3}  >
                <Paper square variant="outlined" sx={{ pt: 2, pr: 2, height: '100%', position: 'relative' }}>
                    <EnchantedForm
                        fields={form_fields}
                        actions_options={{ sx: { "display": "flex", pb: 2, px: 1, justifyContent: "end" } }}
                        data={formData}
                        saveBtnText="Generate image"
                        onError={(err) => toast.error(err.error || err.message || 'Error')}
                        //disabled={service?.premium && !currentTeam?.plan?.premium_access}
                        onSubmit={generateImage}
                    />
                    <IconButton sx={{ position: 'absolute', top: 12, left: 4 }} component={RouterLink} to={featured ? '/' : '/tools/' + (service.name || service._id)}><CloseIcon fontSize="small" /></IconButton>
                </Paper>
            </Grid>
            <Grid item xs={12} sm={8} md={8} lg={9} sx={{ position: "relative", height: '100%' }}>
                <Box sx={{ height: '70vh', textAlign: 'center', p: 2 }}>
                    {error &&
                        <Alert severity="error">
                            {error}
                        </Alert>
                    }
                    {generating &&
                        <Skeleton sx={{ height: '30vh' }} />
                    }
                    {!generating && image?.url &&
                        <Grid container sx={{ height: "100%", maxHeight: "100%" }}>
                            <Grid item xs={12} sm={12} md={9} lg={8} sx={{ height: "100%", maxHeight: "100%", overflow: 'scroll' }}>
                                <div style={{ height: '100%', display: 'inline-block', position: 'relative' }}>
                                    <img style={{ maxWidth: '100%', maxHeight: '100%' }} src={image.url} />
                                    <IconButton
                                        sx={{ position: 'absolute', top: 0, right: 0, display: { xs: "block", sm: 'block', md: "none", lg: 'none' } }}
                                        color="info"
                                        onClick={() => setDialogImage(image)}
                                    >
                                        <InfoOutlinedIcon />
                                    </IconButton>
                                    <IconButton
                                        sx={{ position: 'absolute', bottom: 0, right: 0 }}
                                        color="info"
                                        component={'a'}
                                        href={image.url}
                                        target="_blank"
                                        download="image.png"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </div>
                            </Grid>
                            <Grid item md={3} lg={4} sx={{ height: "100%", maxHeight: "100%", textAlign: 'left', display: { xs: "none", sm: 'none', md: "block", lg: 'block' } }}>
                                <Paper elevation={0} sx={{ pl: 1, height: '100%', overflow: 'scroll' }}>
                                    <Typography variant="subtitle">Image details</Typography> <br /> <br />
                                    <ImageDetails image={image} />
                                </Paper>
                            </Grid>
                        </Grid>
                    }
                    {!generating && !error && !image &&
                        <Paper sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} variant="outlined">
                            <ImageIcon color="disabled" fontSize="large" />
                            <Typography variant="caption" color="disabled">Please enter your prompt</Typography>
                        </Paper>
                    }
                </Box>
                {history?.length > 0 &&
                    <Paper square variant="outlined" sx={{ position: 'absolute', width: '100%', bottom: 0, height: '20vh', pt: 4, pb: 2, px: 2, overflow: 'scroll', display: 'flex', borderLeft: 'none' }} onScroll={onHistoryScroll}>
                        <Typography variant="caption" sx={{ position: 'absolute', top: '4px' }}>Previous Images</Typography>
                        {history?.filter(msg => msg.images?.length).map((msg, key) =>
                            <Box
                                key={key}
                                sx={{ height: '100%', mx: 1, cursor: 'pointer', ...(image?._id === msg.images[0]._id && { borderColor: (theme) => theme.palette.primary.main, borderWidth: '4px', borderStyle: 'solid' }) }}
                                onClick={() => chooseImage(msg.images[0])}
                            >
                                <img height="100%" src={msg.images[0].thumbnail_url || msg.images[0].url} />
                            </Box>
                        )}
                        {historyLoading &&
                            <>
                                <Box sx={{ height: '100%', mx: 1 }} ><Skeleton height="100%" /></Box>
                                <Box sx={{ height: '100%', mx: 1 }} ><Skeleton height="100%" /></Box>
                                <Box sx={{ height: '100%', mx: 1 }} ><Skeleton height="100%" /></Box>
                            </>
                        }
                    </Paper>
                }
            </Grid>
        </Grid>
        <Dialog open={dialogImage?._id ? true : false} onClose={() => setDialogImage({})}>
            <DialogTitle>Image details</DialogTitle>
            <DialogContent>
                <ImageDetails image={dialogImage} />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDialogImage({})}>Close</Button>
            </DialogActions>
        </Dialog>
    </>
}
export default Generator;