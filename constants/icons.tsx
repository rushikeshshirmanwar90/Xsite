import Entypo from '@expo/vector-icons/Entypo';
import Fontisto from '@expo/vector-icons/Fontisto';
import Ionicons from '@expo/vector-icons/Ionicons';

export const icons = {
    index: (props: any) => < Entypo name="home" size={24} {...props} />,
    staff: (props: any) => < Ionicons name='grid' size={24} {...props} />,
    profile: (props: any) => < Fontisto name='bell-alt' size={24} {...props} />,
}