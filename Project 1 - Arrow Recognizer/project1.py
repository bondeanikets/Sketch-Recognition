

'''
CSCE 624: SKETCH RECOGNITION: PROJECT 1
ANIKET SANJIV BONDE 
'''


import json
import codecs
import pandas as pd
import numpy as np
import scipy.stats
import matplotlib.pyplot as plt
from copy import copy
np.seterr(divide='ignore', invalid='ignore')


'''
Edit these variables:
    arrows_path = give the whole path to arrows.json, as raw string. (like  r'E:\Users\Dell\...\Project 1\Training\Arrows\arrows.json') 
    other_path = give the whole path to other.json, as raw string. (like  r'E:\Users\Dell\...\Project 1\Training\Other\other.json') 
    all_features_csv_path = give the whole path to save first csv which has all the features, as raw string. 
                           (like  r'E:\Users\Dell\...\Project 1\all_features.csv') --> This will create 'all_features.csv' in 'Project 1' after 
                            the execution of the program
    subset_features_csv_path = give the whole path to save second csv which has subset of the features, as raw string. 
                              (like  r'E:\Users\Dell\...\Project 1\subset_features.csv') --> This will create 'subset_features.csv' in 'Project 1' after 
                               the execution of the program.
'''
arrows_path = r'E:\...\Project 1\Training\Arrows\arrows.json'
other_path = r'E:\...\Project 1\Training\Other\other.json'
all_features_csv_path = r'E:\...\all_features.csv'
subset_features_csv_path = r'E:\...\subset_features.csv'


def import_data(arrows_path, other_path):
    '''
    INPUT:
        arrows_path : Path for arrows.json
        other_path  : Path for other.json
        
    OUTPUT:
        Returns a pandas dataframe object with first 10000 rows as 
        arrows and the next 10000 rows as others
    '''
    
    data = []
    with codecs.open(arrows_path, 'rU', 'utf-8') as f:
        for line in f:
            data.append(json.loads(line))           
           
    with codecs.open(other_path, 'rU', 'utf-8') as f:
        for line in f:
            data.append(json.loads(line))
           
    data_df = pd.DataFrame(data)
    columns_to_keep = ['points', 'shapes', 'strokes', 'substrokes', 'time']
    data_df = data_df[columns_to_keep]
    data_df['class'] = np.where(((data_df['shapes'].apply(lambda x: x[0]['interpretation'])) == 'arrow'), 'arrow', 'other')
    
    return data_df
    
    
def calculate_stroke_points(row):
    '''
    Returns a added column which has list of strokes, with [x_co_ordinate, y_co_ordinate, time_stamp]
    for each stroke
    '''
    
    strokes_list = []
    for stroke in row['strokes']:
        stroke_points_list = []
        for point in stroke['points']:
            '''
            Some strokes have 'None' values as point ids
            '''
            if(point != None):
                point_attributes = next((item for item in row['points'] if item["id"] == point), None)
                stroke_points_list.append([point_attributes['x'], point_attributes['y'], point_attributes['time']])
        
        stroke_points_list.sort(key=lambda x: int(x[2]))
        strokes_list.append(stroke_points_list)
    
    row['strokes_list'] = strokes_list
    return row
    
def multi_strokes_to_single_strokes(row):
    single_stroke_points_list = []
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point in stroke:
                single_stroke_points_list.append(point)
                
    single_stroke_points_list.sort(key=lambda x: int(x[2]))
    row['single_stroke_points_list'] = single_stroke_points_list
    return row
    
    
    '''
    Pre-processing code
    '''
def resampling(row):
    row['resampled_strokes_list'] = []
    S = np.divide(float(row['diagonal_length_bounding_box']), float(40))
    D = 0
    if (S != 0):
        for stroke in row['strokes_list']:
            points = copy(stroke)
            resampled_stroke = []
            if len(stroke) != 0:
                resampled_stroke.append(points[0])
                i = 1
                while (i < len(points)):
                    d = np.sqrt((points[i - 1][0] - points[i][0])**2 +
                                (points[i - 1][1] - points[i][1])**2)
                    if D + d >= S:
                        fac = (S - D) / float(d)
                        new_point_x = points[i - 1][0] + (fac * (points[i][0] - points[i - 1][0]))
                        new_point_y = points[i - 1][1] + (fac * (points[i][1] - points[i - 1][1]))
                        resampled_stroke.append([new_point_x, new_point_y])
                        points.insert(i,[new_point_x, new_point_y])
                        D = 0
                    else:
                        D = D + d
                    i += 1
                D = 0
                row['resampled_strokes_list'].append(resampled_stroke)
            else:
                row['resampled_strokes_list'].append([])
    return row
    
    
def resampled_multi_strokes_to_single_strokes(row):
    single_stroke_points_list = []
    for stroke in row['resampled_strokes_list']:
        if len(stroke) != 0:
            for point in stroke:
                single_stroke_points_list.append(point)
                
    row['resampled_single_stroke_points_list'] = single_stroke_points_list
    return row
    
    
def maximum_minimum_co_ordinates(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        row['x_max'] = max(coordinates_list[0])
        row['y_max'] = max(coordinates_list[1])
        row['x_min'] = min(coordinates_list[0])
        row['y_min'] = min(coordinates_list[1])
    else:
        row['x_max'], row['y_max'], row['x_min'], row['y_min'] = 0, 0, 0, 0
    return row
    
    
    
    
    '''
    Each function from here corresponds to a feature.
    '''
def cosine_initial_angle(row):
    first_stroke = row['strokes_list'][0]
    if (len(first_stroke) != 0 and len(first_stroke) != 1):
        row['cosine_initial_angle'] = np.divide(float(np.subtract(first_stroke[0][0], first_stroke[2][0])), 
                                                float(np.sqrt(np.add(np.square(np.subtract(first_stroke[0][0], first_stroke[2][0])),
                                                                np.square(np.subtract(first_stroke[0][1], first_stroke[2][1]))))))
    else:
        row['cosine_initial_angle'] = 0
    
    return row

    
def sine_initial_angle(row):
    first_stroke = row['strokes_list'][0]
    if (len(first_stroke) != 0 and len(first_stroke) != 1):
        row['sine_initial_angle'] = np.divide(float(np.subtract(first_stroke[0][1], first_stroke[2][1])), 
                                                float(np.sqrt(np.add(np.square(np.subtract(first_stroke[0][0], first_stroke[2][0])),
                                                                np.square(np.subtract(first_stroke[0][1], first_stroke[2][1]))))))
    else:
        row['sine_initial_angle'] = 0
    
    return row
    
    
def diagonal_length_bounding_box(row):
    row['diagonal_length_bounding_box'] = np.sqrt((row['x_max'] - row['x_min'])**2 + 
                                               (row['y_max'] - row['y_min'])**2)
    
    return row


def diagonal_angle_bounding_box(row):
    row['diagonal_angle_bounding_box'] = np.degrees(np.arctan(np.divide(float(row['y_max'] - row['y_min']), float(row['x_max'] - row['x_min']))))
    return row


def initial_last_points_dist(row):
    if (len(row['single_stroke_points_list']) != 0):
        first = row['single_stroke_points_list'][0]
        last = row['single_stroke_points_list'][-1]
        row['initial_last_points_dist'] = np.sqrt((first[0] - last[0])**2 + 
                                                  (first[1] - last[1])**2)
    
    else:
        row['initial_last_points_dist'] = 0
    return row


def cosine_angle_initial_last_points(row):
    if (len(row['single_stroke_points_list']) != 0 and row['initial_last_points_dist'] != 0):
        first = row['single_stroke_points_list'][0]
        last = row['single_stroke_points_list'][-1]
        row['cosine_angle_initial_last_points'] = np.divide(float(first[0] - last[0]), float(row['initial_last_points_dist']))
    
    else:
        row['cosine_angle_initial_last_points'] = 0
    return row


def sine_angle_initial_last_points(row):
    if (len(row['single_stroke_points_list']) != 0 and row['initial_last_points_dist'] != 0):
        first = row['single_stroke_points_list'][0]
        last = row['single_stroke_points_list'][-1]
        row['sine_angle_initial_last_points'] = np.divide(float(first[1] - last[1]), float(row['initial_last_points_dist']))
    
    else:
        row['sine_angle_initial_last_points'] = 0
    return row


def stroke_length(row):
    stroke_length = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 1):
                stroke_length += np.sqrt((stroke[point_index + 1][0] - stroke[point_index][0])**2 +
                                         (stroke[point_index + 1][1] - stroke[point_index][1])**2)
    
    row['stroke_length'] = stroke_length
    return row


def get_angle(p0, p1, p2):
    ''' compute angle (in degrees) for p0, p1, p2
    Inputs:
        p0,p1,p2 - points in the form of [x,y]
    '''
    
    v0 = np.array(p0) - np.array(p1)
    v1 = np.array(p2) - np.array(p1)

    angle = np.math.atan2(np.linalg.det([v0,v1]),np.dot(v0,v1))
    return np.degrees(angle)


def total_angle(row):
    total_angle = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                total_angle += get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                         [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                         [stroke[point_index + 2][0], stroke[point_index + 2][1]]) 
    
    row['total_angle'] = total_angle
    return row


    
def total_absolute_angle(row):
    total_absolute_angle = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                total_absolute_angle += np.absolute(get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                                              [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                                              [stroke[point_index + 2][0], stroke[point_index + 2][1]]))
    
    row['total_absolute_angle'] = total_absolute_angle
    return row
    
    
def total_squared_angle(row):
    total_squared_angle = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                total_squared_angle += np.square(get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                                           [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                                           [stroke[point_index + 2][0], stroke[point_index + 2][1]]))
    
    row['total_squared_angle'] = total_squared_angle
    return row
    
    
def aspect(row):    
    row['aspect'] = np.absolute(45 - row['diagonal_angle_bounding_box'])
    return row
    
    
def area_bounding_box(row):
    row['area_bounding_box'] = np.multiply(float(row['x_max'] - row['x_min']), float(row['y_max'] - row['y_min']))
    return row
    
    
def log_area_bounding_box(row):
    area = np.multiply(float(row['x_max'] - row['x_min']), float(row['y_max'] - row['y_min']))
    if (area != 0):
        row['log_area_bounding_box'] = float(np.log(area))
    else:
        row['log_area_bounding_box'] = float(-50)
    return row
    
    
def log_aspect(row):
    if(row['aspect'] != 0):
        row['log_aspect'] = np.log(row['aspect'])
    else:
        row['log_aspect'] = float(-50)
    return row


def log_stroke_length(row):    
    if(row['stroke_length'] != 0):
        row['log_stroke_length'] = np.log(row['stroke_length'])
    else:
        row['log_stroke_length'] = float(-50)
    return row


def total_by_absolute_angle(row):
    if (row['total_absolute_angle'] != 0):
        row['total_by_absolute_angle'] = np.divide(float(row['total_angle']), float(row['total_absolute_angle']))
    else:
        row['total_by_absolute_angle'] = 0
    return row


def total_angle_by_stroke_length(row):
    if (row['stroke_length'] != 0):
        row['total_angle_by_stroke_length'] = np.divide(float(row['total_angle']), float(row['stroke_length']))
    else:
        row['total_angle_by_stroke_length'] = 0
    return row


def stroke_length_by_initial_last_points_distance(row):
    if (row['initial_last_points_dist'] != 0):
        row['stroke_length_by_initial_last_points_distance'] = np.divide(float(row['stroke_length']),
                                                                         float(row['initial_last_points_dist']))
    else:
        row['stroke_length_by_initial_last_points_distance'] = 0
    return row


def stroke_length_by_diagonal_length(row):
    if (row['diagonal_length_bounding_box'] != 0):
        row['stroke_length_by_diagonal_length'] = np.divide(float(row['stroke_length']),
                                                            float(row['diagonal_length_bounding_box']))
    else:
        row['stroke_length_by_diagonal_length'] = 0
    return row


def initial_last_points_distance_by_diagonal_length(row):
    if (row['diagonal_length_bounding_box'] != 0):
        row['initial_last_points_distance_by_diagonal_length'] = np.divide(float(row['initial_last_points_dist']),
                                                                           float(row['diagonal_length_bounding_box']))
    else:
        row['initial_last_points_distance_by_diagonal_length'] = 0
    return row


def curviness(row):
    curviness = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                current_angle = get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                          [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                          [stroke[point_index + 2][0], stroke[point_index + 2][1]])
                if (np.absolute(current_angle) < 19):
                    curviness += current_angle
    
    row['curviness'] = curviness
    return row


def total_time(row):
    if (len(row['single_stroke_points_list']) != 0):
        first = row['single_stroke_points_list'][0]
        last = row['single_stroke_points_list'][-1]
        row['total_time'] = float(int(last[2]) - int(first[2]))
    
    else:
        row['total_time'] = 0
    return row


def max_speed(row):
    speeds = []
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 1):
                time = int(stroke[point_index + 1][2]) - int(stroke[point_index][2])
                if (time != 0):
                    length = np.sqrt((stroke[point_index + 1][0] - stroke[point_index][0])**2 +
                                     (stroke[point_index + 1][1] - stroke[point_index][1])**2)
                    speeds.append(float(length/float(time)))
    
    try:
        row['max_speed'] = max(speeds)
    except:
        row['max_speed'] = 0
    return row


def avg_speed(row):
    speeds = []
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 1):
                time = int(stroke[point_index + 1][2]) - int(stroke[point_index][2])
                if (time != 0):
                    length = np.sqrt((stroke[point_index + 1][0] - stroke[point_index][0])**2 +
                                     (stroke[point_index + 1][1] - stroke[point_index][1])**2)
                    speeds.append(float(length/float(time)))
    
    try:
        row['avg_speed'] = np.average(speeds)
    except:
        row['avg_speed'] = 0
    return row


def get_char(angle):
    if ((angle>=0 and angle<15) or (angle>=165 and angle<=180)):
        return 'A'
    elif (angle>=15 and angle<45):
        return 'B'
    elif (angle>=45 and angle<75):
        return 'C'
    elif (angle>=75 and angle<105):
        return 'D'
    elif (angle>=105 and angle<135):
        return 'E'
    elif (angle>=135 and angle<165):
        return 'F'
    return 'X'


def entropy(row):
    char_seq = []
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                char_seq.append(get_char(np.absolute(get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                                              [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                                              [stroke[point_index + 2][0], stroke[point_index + 2][1]]))))
    
    
    row['entropy'] = scipy.stats.entropy(pd.Series(list(char_seq)).value_counts(normalize=True, sort=False))
    return row


def stroke_length_by_initial_centroid_points_dist(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        centroid_x = np.mean(coordinates_list[0])
        centroid_y = np.mean(coordinates_list[1])
        initial_centroid_points_dist = np.sqrt(np.add(float(row['single_stroke_points_list'][0][0] - centroid_x)**2,
                                                      float(row['single_stroke_points_list'][0][1] - centroid_y)**2))
        if (initial_centroid_points_dist != 0):
            row['stroke_length_by_initial_centroid_points_dist'] = np.divide(float(row['stroke_length']),
                                                                             float(initial_centroid_points_dist))
        else:
            row['stroke_length_by_initial_centroid_points_dist'] = 0
    else:
        row['stroke_length_by_initial_centroid_points_dist'] = 0
    return row


def diagonal_length_by_initial_centroid_points_dist(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        centroid_x = np.mean(coordinates_list[0])
        centroid_y = np.mean(coordinates_list[1])
        initial_centroid_points_dist = np.sqrt(np.add(float(row['single_stroke_points_list'][0][0] - centroid_x)**2,
                                                      float(row['single_stroke_points_list'][0][1] - centroid_y)**2))
        if (initial_centroid_points_dist != 0):
            row['diagonal_length_by_initial_centroid_points_dist'] = np.divide(float(row['diagonal_length_bounding_box']),
                                                                               float(initial_centroid_points_dist))
        else:
            row['diagonal_length_by_initial_centroid_points_dist'] = 0
    else:
        row['diagonal_length_by_initial_centroid_points_dist'] = 0
    return row


def no_of_change_of_direction(row):
    direction_change = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                current_angle = get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                          [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                          [stroke[point_index + 2][0], stroke[point_index + 2][1]])
                if (np.absolute(current_angle) > 90):
                    direction_change += 1
    
    row['no_of_change_of_direction'] = direction_change
    return row


def density_of_points(row):
    if (row['stroke_length'] != 0):
        row['density_of_points'] = np.divide(float(len(row['single_stroke_points_list'])), float(row['stroke_length']))
    else:
        row['density_of_points'] = 0
    return row


def normalized_centroid_angle(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        centroid_x = np.mean(coordinates_list[0])
        centroid_y = np.mean(coordinates_list[1])        
        normalized_centroid_angle = get_angle([row['x_max'], row['y_min']],
                                              [row['x_min'], row['y_min']],
                                              [centroid_x, centroid_y])
        row['normalized_centroid_angle'] = normalized_centroid_angle
    else:
        row['normalized_centroid_angle'] = 0
    return row


def aspect_normalized_centroid_angle(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        centroid_x = np.mean(coordinates_list[0])
        centroid_y = np.mean(coordinates_list[1])        
        normalized_centroid_angle = get_angle([row['x_max'], row['y_min']],
                                              [row['x_min'], row['y_min']],
                                              [centroid_x, centroid_y])
        row['aspect_normalized_centroid_angle'] = np.absolute(45 - normalized_centroid_angle)
    else:
        row['aspect_normalized_centroid_angle'] = 0
    return row


def initial_centroid_points_dist(row):
    if (len(row['single_stroke_points_list']) != 0):
        coordinates_list = zip(*row['single_stroke_points_list'])
        centroid_x = np.mean(coordinates_list[0])
        centroid_y = np.mean(coordinates_list[1])
        row['initial_centroid_points_dist'] = np.sqrt(np.add(float(row['single_stroke_points_list'][0][0] - centroid_x)**2,
                                                      float(row['single_stroke_points_list'][0][1] - centroid_y)**2))
    else:
        row['initial_centroid_points_dist'] = 0
    return row


def no_of_corners(row):
    no_of_corners = float(0)
    for stroke in row['strokes_list']:
        if len(stroke) != 0:
            for point_index in range(len(stroke) - 2):
                current_angle = get_angle([stroke[point_index][0], stroke[point_index][1]], 
                                          [stroke[point_index + 1][0], stroke[point_index + 1][1]],
                                          [stroke[point_index + 2][0], stroke[point_index + 2][1]])
                if (np.absolute(current_angle) > 19):
                    no_of_corners += 1
    
    row['no_of_corners'] = no_of_corners
    return row


def velocity(row):
    if (row['total_time'] != 0):
        row['velocity'] = np.divide(float(row['initial_last_points_dist']), float(row['total_time']))
    else:
        row['velocity'] = float(0)
    return row

    
def plot_stroke(stroke):
    x_, y_ = zip(*stroke)[0], zip(*stroke)[1]
    plt.plot(x_, y_)
    plt.plot(x_, y_, 'or')
    #plt.savefig('name.png', dpi=900)
    plt.show()
    return
    
####################################################################################################
#                                           End of Helper Functions
####################################################################################################
    
if __name__ == "__main__":
    print('\n Importing Data ...')
    
    '''
    Importing data
    '''    
    data_df = import_data(arrows_path, other_path)
    print('\n Pre-processing Data and Calculating Features...')
    
    '''
    Pre-processing Data and Calculating Features
    '''
    data_df = data_df.apply(lambda row: calculate_stroke_points(row), axis=1)
    data_df = data_df.apply(lambda row: multi_strokes_to_single_strokes(row), axis=1)
    data_df = data_df.apply(lambda row: maximum_minimum_co_ordinates(row), axis=1)
    data_df = data_df.apply(lambda row: cosine_initial_angle(row), axis=1)
    data_df = data_df.apply(lambda row: sine_initial_angle(row), axis=1)
    data_df = data_df.apply(lambda row: diagonal_length_bounding_box(row), axis=1)
    data_df = data_df.apply(lambda row: resampling(row), axis=1)
    data_df = data_df.apply(lambda row: resampled_multi_strokes_to_single_strokes(row), axis=1)
    data_df = data_df.apply(lambda row: diagonal_angle_bounding_box(row), axis=1)
    data_df = data_df.apply(lambda row: initial_last_points_dist(row), axis=1)
    data_df = data_df.apply(lambda row: cosine_angle_initial_last_points(row), axis=1)
    data_df = data_df.apply(lambda row: sine_angle_initial_last_points(row), axis=1)
    data_df = data_df.apply(lambda row: stroke_length(row), axis=1)
    data_df = data_df.apply(lambda row: total_angle(row), axis=1)
    data_df = data_df.apply(lambda row: total_absolute_angle(row), axis=1)
    data_df = data_df.apply(lambda row: total_squared_angle(row), axis=1)
    data_df = data_df.apply(lambda row: aspect(row), axis=1)
    data_df = data_df.apply(lambda row: area_bounding_box(row), axis=1)
    data_df = data_df.apply(lambda row: log_area_bounding_box(row), axis=1)
    data_df = data_df.apply(lambda row: log_aspect(row), axis=1)
    data_df = data_df.apply(lambda row: log_stroke_length(row), axis=1)
    data_df = data_df.apply(lambda row: total_by_absolute_angle(row), axis=1)
    data_df = data_df.apply(lambda row: total_angle_by_stroke_length(row), axis=1)
    data_df = data_df.apply(lambda row: stroke_length_by_initial_last_points_distance(row), axis=1)
    data_df = data_df.apply(lambda row: stroke_length_by_diagonal_length(row), axis=1)
    data_df = data_df.apply(lambda row: initial_last_points_distance_by_diagonal_length(row), axis=1)
    data_df = data_df.apply(lambda row: curviness(row), axis=1)
    data_df = data_df.apply(lambda row: total_time(row), axis=1)
    data_df = data_df.apply(lambda row: max_speed(row), axis=1)
    data_df = data_df.apply(lambda row: avg_speed(row), axis=1)
    data_df = data_df.apply(lambda row: entropy(row), axis=1)
    data_df = data_df.apply(lambda row: stroke_length_by_initial_centroid_points_dist(row), axis=1) 
    data_df = data_df.apply(lambda row: diagonal_length_by_initial_centroid_points_dist(row), axis=1)
    data_df = data_df.apply(lambda row: no_of_change_of_direction(row), axis=1)
    data_df = data_df.apply(lambda row: density_of_points(row), axis=1)
    data_df = data_df.apply(lambda row: normalized_centroid_angle(row), axis=1)
    data_df = data_df.apply(lambda row: aspect_normalized_centroid_angle(row), axis=1)
    data_df = data_df.apply(lambda row: initial_centroid_points_dist(row), axis=1)
    data_df = data_df.apply(lambda row: no_of_corners(row), axis=1)
    data_df = data_df.apply(lambda row: velocity(row), axis=1)
    print('\n Saving features to csv ...')
    
    
    '''
    Saving Features to CSVs
    '''    
    all_feature_list = ['cosine_initial_angle', 'sine_initial_angle', 'diagonal_length_bounding_box',
                        'diagonal_angle_bounding_box', 'initial_last_points_dist', 
                        'cosine_angle_initial_last_points', 'sine_angle_initial_last_points', 
                        'stroke_length', 'total_angle', 'total_absolute_angle', 'total_squared_angle',
                        'aspect', 'area_bounding_box', 'log_area_bounding_box', 'log_aspect', 
                        'log_stroke_length', 'total_by_absolute_angle', 'total_angle_by_stroke_length',
                        'stroke_length_by_initial_last_points_distance', 'stroke_length_by_diagonal_length',
                        'initial_last_points_distance_by_diagonal_length', 'curviness', 'total_time', 
                        'max_speed', 'avg_speed', 'entropy', 'stroke_length_by_initial_centroid_points_dist',
                        'diagonal_length_by_initial_centroid_points_dist', 'no_of_change_of_direction', 
                        'density_of_points','normalized_centroid_angle', 'aspect_normalized_centroid_angle',
                        'initial_centroid_points_dist', 'no_of_corners', 'velocity', 'class']
    
    '''
    Produces csv for all_feature_list
    '''
    data_df[all_feature_list].to_csv(all_features_csv_path, index=False)
    
    subset_feature_list = ['cosine_initial_angle', 'sine_initial_angle', 'diagonal_length_bounding_box',
                        'diagonal_angle_bounding_box', 'initial_last_points_dist', 
                        'cosine_angle_initial_last_points', 'sine_angle_initial_last_points', 
                        'stroke_length', 'total_angle', 'total_absolute_angle', 'total_squared_angle',
                        'aspect', 'area_bounding_box', 'log_area_bounding_box', 'log_aspect', 
                        'log_stroke_length', 'total_by_absolute_angle', 'total_angle_by_stroke_length',
                        'stroke_length_by_initial_last_points_distance', 'stroke_length_by_diagonal_length',
                        'initial_last_points_distance_by_diagonal_length', 'curviness', 'entropy', 
                        'stroke_length_by_initial_centroid_points_dist',
                        'diagonal_length_by_initial_centroid_points_dist', 'no_of_change_of_direction', 
                        'density_of_points','normalized_centroid_angle', 'aspect_normalized_centroid_angle',
                        'initial_centroid_points_dist', 'no_of_corners', 'class']
      
                        
    '''
    Produces csv for subset_feature_list
    '''
    data_df[subset_feature_list].to_csv(subset_features_csv_path, index=False)
    
    print("\n All the CSV's are created")