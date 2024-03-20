import { Alert, ImageList, ImageListItem, ImageListItemBar, Skeleton, IconButton,useMediaQuery } from "@mui/material"
import { useEffect } from "react";
import { useState } from "react"
import { useAuth, restAPI } from 'blustai-react-core';
import {InfoOutlinedIcon} from 'blustai-react-ui';
import { useTheme } from '@mui/material/styles';
import { useRef } from "react";


const ImagePreviewDialog=(props)=>{

}

export const FeaturedImages = (props) => {
    const {getImageModelName} = props;
    const { isInitialized } = useAuth();
    const [images, setImages] = useState([]);
    const [endReached,setEndReached] =useState(false);
    const [error, setError] = useState();
    const [loading, setLoading] = useState(true);
    const [previewDialogStatus,setPreviewDialogStatus]=useState({open:false});
    const stateRef = useRef();
    stateRef.current = { images, loading,endReached };


    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.between("sm", "md"));
    const xs = useMediaQuery(theme.breakpoints.down("sm"));

    const cols = xs ? 3 : (sm ? 6 : 8);

    const loadImages = (currentImages=[]) => {
        setLoading(true);
        restAPI.list("featured_images",{sort:'{"created_at":-1}',skip:currentImages.length,limit:20, filters:'{"category":{"$ne":"nsfw"}}'}).then(_images => {
            setImages([...currentImages,..._images]);
            if (!_images.length) setEndReached(true);
            setLoading(false);
        }).catch(err => {
            setError(err.error || err.message || "Error loading images");
            setLoading(false);
        })
    }

    useEffect(() => { if (!images?.length) loadImages() }, [isInitialized])

    useEffect(() => {
        window.addEventListener('scroll', handleScroll.bind(this));
        setEndReached(false);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };

    }, []); 

    const previewImage=(index)=>{
        setPreviewDialogStatus({open:true,current_key:index});
    }

    const handleScroll = () => {
        const totalPageHeight = document.documentElement.scrollHeight;
        const scrollPoint = window.scrollY + window.innerHeight;
        const threshold = 100; 
        if ((scrollPoint + threshold >= totalPageHeight) && !stateRef.current?.endReached && !stateRef.current?.loading ) {
            loadImages(stateRef.current?.images || []);
        }
    };

    return <ImageList sx={{ width: '100%', maxWidth:'100%' }} cols={cols}>
        {images?.map((item,key) => (
            <ImageListItem key={key} onClick={()=>previewImage(key)}>
                <img
                    srcSet={`${item.thumbnail_url || item.url}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
                    src={`${item.thumbnail_url || item.url}?w=164&h=164&fit=crop&auto=format`}
                    alt={item.prompt}
                    loading="lazy"
                />
                <ImageListItemBar
                    title={item.element_id}
                    subtitle={item.prompt}
                    actionIcon={
                        <IconButton
                            sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                            aria-label={`info about ${item.prompt}`}
                        >
                            <InfoOutlinedIcon />
                        </IconButton>
                    }
                />
            </ImageListItem>
        ))}
        {loading &&
            <Skeleton component={ImageListItem}/>
        }
        {error &&
            <Alert>{error}</Alert>
        }
        <ImagePreviewDialog 
            open={previewDialogStatus.open}
            setOpen={(open)=>setPreviewDialogStatus({open})}
            images={images}
            image_key={previewDialogStatus.current_key}
            showInfo={true}
            getImageModelName={getImageModelName}
        />
    </ImageList>
}