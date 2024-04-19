import { Box } from '@mui/material';
import { AppHeaderBar } from 'blustai-react-ui';
import { ErrorBoundary } from "react-error-boundary";
import { styled } from '@mui/material/styles';
import {SimpleError} from "blustai-react-ui";

const Main = styled('main', { shouldForwardProp: (prop) => !['hide'].includes(prop) })(
    ({ theme, hide }) => ({
        flexGrow: 1,
        position: 'relative',
        ...!hide && {
            paddingTop: '64px', //AppBAr height
            '& .chat-card-fullscreen': {
                paddingTop: '64px'
            }
            // padding: theme.spacing(3),
        },
    }),
);

const onSideBarToggle = (val) => {
    console.log("toogled")
}


const MainLayout = (props) => {
    const { children,
        hide_toolbar = false,
        studioMode = false,
        limitHeight = false,
        service,
        subtitle,
        drawerVariant,
        threadsOpened,
        setThreadsOpened,
        setToolsParent
    } = props;

    const app_header_options = {
        domain: import.meta.env.VITE_BLUST_DOMAIN,
        ...(service?.full_screen_only || studioMode) && {
            onSideBarToggle:setThreadsOpened,
            sidebarInitialState: threadsOpened, //TODO for some reason initial value doesn't work
            drawerVariant: drawerVariant
        },
    }

    return <Box sx={{ display: 'flex', flexDirection: 'column' }}  {...limitHeight && { className: "vh100withFix" }} >
        <ErrorBoundary fallback={<SimpleError allowReload={true} />} >
            <AppHeaderBar options={app_header_options} subtitle={subtitle} studioMode={true} setToolsParent={setToolsParent} />
            <Main hide={hide_toolbar} {...limitHeight && {sx:{'height':'100%'}}} >
                {children}
            </Main>
        </ErrorBoundary>
    </Box>

}
export default MainLayout;